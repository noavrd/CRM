import { Router } from "express";
import { adminDb } from "../firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";

const router = Router();

/* ---------- helpers ---------- */
function normalizePayments(
  payments: any
): { amount: number; description: string; plusVAT: boolean }[] {
  return Array.isArray(payments)
    ? payments.map((p: any) => ({
        amount: Number(p?.amount ?? 0),
        description: p?.description ? String(p.description) : "",
        plusVAT: Boolean(p?.plusVAT),
      }))
    : [];
}
function sumPayments(items: { amount: number }[]) {
  return items.reduce((s, it) => s + (Number(it?.amount) || 0), 0);
}

// סטטוסים מותרים (Single Source of Truth – תואם למה שבקליינט)
const STATUS_VALUES = [
  "quote",
  "pre_visit",
  "post_visit",
  "in_work",
  "review",
  "done",
] as const;
type ProjectStatus = (typeof STATUS_VALUES)[number];
const isValidStatus = (s: any): s is ProjectStatus =>
  typeof s === "string" && STATUS_VALUES.includes(s as ProjectStatus);

/* ---------- GET /api/projects/stats (לדשבורד) ---------- */
router.get("/stats", async (req, res) => {
  try {
    const userId = (req as any).userId as string;

    // מציגים רק פרויקטים לא בארכיון בדשבורד
    const snap = await adminDb
      .collection("projects")
      .where("userId", "==", userId)
      .where("archived", "==", false)
      .get();

    // התחלה ב-0 לכל סטטוס
    const counts: Record<ProjectStatus, number> = {
      quote: 0,
      pre_visit: 0,
      post_visit: 0,
      in_work: 0,
      review: 0,
      done: 0,
    };

    snap.forEach((d) => {
      // status החדש (מחייב להיות אחד מה-6)
      const s = d.get("status");
      if (isValidStatus(s)) {
        counts[s] += 1;
        return;
      }

      // תאימות לאחור: אם נשמר פעם "stage"
      const legacy = d.get("stage"); // "pre_visit" | "post_visit"
      if (legacy === "pre_visit") counts.pre_visit += 1;
      if (legacy === "post_visit") counts.post_visit += 1;
    });

    const total = STATUS_VALUES.reduce((acc, k) => acc + counts[k], 0);
    res.json({ total, ...counts });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/projects?status=pre_visit
router.get("/", async (req, res) => {
  try {
    const userId = (req as any).userId as string;
    const status = req.query.status as string | undefined;

    const base = adminDb.collection("projects").where("userId", "==", userId);

    // 1. אין status → מחזירים את כל הפרויקטים של המשתמש, ממוינים בקוד
    if (!status || !isValidStatus(status)) {
      const snap = await base.get(); // ← בלי orderBy / limit

      let items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // מיון בצד השרת לפי createdAt (Firestore Timestamp)
      items = items.sort((a: any, b: any) => {
        const aTs = a.createdAt;
        const bTs = b.createdAt;

        const aMs =
          aTs && typeof aTs.toMillis === "function" ? aTs.toMillis() : 0;
        const bMs =
          bTs && typeof bTs.toMillis === "function" ? bTs.toMillis() : 0;

        return bMs - aMs; // חדש קודם
      });

      return res.json(items);
    }

    // 2. יש status תקין → מביאות לפי status ו-stage (לתאימות לאחור)
    const snaps: FirebaseFirestore.QuerySnapshot[] = [];

    // שדה status החדש
    snaps.push(await base.where("status", "==", status).get());

    // תאימות לאחור ל-pre_visit / post_visit לפי stage
    if (status === "pre_visit" || status === "post_visit") {
      snaps.push(await base.where("stage", "==", status).get());
    }

    const seen = new Set<string>();
    let items = snaps.flatMap(
      (snap) =>
        snap.docs
          .map((d) => {
            if (seen.has(d.id)) return null;
            seen.add(d.id);
            return { id: d.id, ...d.data() };
          })
          .filter(Boolean) as any[]
    );

    // גם כאן מיון לפי createdAt אם קיים
    items = items.sort((a: any, b: any) => {
      const aTs = a.createdAt;
      const bTs = b.createdAt;

      const aMs =
        aTs && typeof aTs.toMillis === "function" ? aTs.toMillis() : 0;
      const bMs =
        bTs && typeof bTs.toMillis === "function" ? bTs.toMillis() : 0;

      return bMs - aMs;
    });

    res.json(items);
  } catch (e: any) {
    console.error("GET /api/projects error:", e);
    res.status(500).json({ error: e.message });
  }
});

/* ---------- POST /api/projects (יצירת פרויקט חדש) ---------- */
// body מינימלי:
// { name: string, status: ProjectStatus, customer?, address?, asset?, visit?, payments?, notes?, archived? }
router.post("/", async (req, res) => {
  try {
    const userId = (req as any).userId as string;
    const {
      name,
      status, // ← הסטטוס היחיד במערכת
      customer,
      address,
      asset,
      visit,
      payments,
      notes,
      archived,
    } = req.body || {};

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "name is required" });
    }
    if (!isValidStatus(status)) {
      return res
        .status(400)
        .json({ error: `status must be one of: ${STATUS_VALUES.join(", ")}` });
    }

    const safePayments = normalizePayments(payments);
    const total = sumPayments(safePayments);

    const ref = await adminDb.collection("projects").add({
      userId,
      name: name.trim(),
      status, // אחד מה-6
      archived: Boolean(archived), // ברירת מחדל false אם לא נשלח

      // פרטי לקוח
      customer: {
        name: customer?.name ?? "",
        phone: customer?.phone ?? "",
        email: customer?.email ?? "",
        shippingEmail: customer?.shippingEmail ?? "",
        city: customer?.city ?? "",
        address: customer?.address ?? "",
        company: customer?.company ?? "",
        description: customer?.description ?? "",
      },

      // כתובת נכס
      address: {
        city: address?.city ?? "",
        street: address?.street ?? "",
        neighborhood: address?.neighborhood ?? "",
        number: address?.number ?? "",
        apt: address?.apt ?? "",
        block: address?.block ?? "", // גוש
        parcel: address?.parcel ?? "", // חלקה
        subParcel: address?.subParcel ?? "", // תת חלקה
        plot: address?.plot ?? "", // מגרש
      },

      // פרטי נכס
      asset: {
        floor: asset?.floor ?? "",
        rooms: asset?.rooms ?? "",
        areaSqm: asset?.areaSqm ?? "",
        propertyType: asset?.propertyType ?? "",
        usage: asset?.usage ?? "",
        purpose: asset?.purpose ?? "",
        appraisalDueDate: asset?.appraisalDueDate ?? "", // yyyy-mm-dd
        submissionDueDate: asset?.submissionDueDate ?? "", // yyyy-mm-dd
        assessor: asset?.assessor ?? "",
        referrer: asset?.referrer ?? "", // גורם מפנה
      },

      // תיאום ביקור
      visit: {
        contactRole: visit?.contactRole ?? "",
        contactName: visit?.contactName ?? "",
        contactPhone: visit?.contactPhone ?? "",
        visitDate: visit?.visitDate ?? "", // yyyy-mm-dd
        visitTime: visit?.visitTime ?? "", // HH:mm
        notes: visit?.notes ?? "",
      },

      payments: safePayments,
      paymentsTotal: total,
      notes: notes ?? "",

      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    res.json({ id: ref.id });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/* ---------- PUT /api/projects/:id (עדכון חלקי) ---------- */
router.put("/:id", async (req, res) => {
  try {
    const userId = (req as any).userId as string;
    const ref = adminDb.collection("projects").doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists || doc.get("userId") !== userId) {
      return res.status(404).json({ error: "not found" });
    }

    const {
      name,
      status,
      customer,
      address,
      asset,
      visit,
      payments,
      notes,
      archived,
    } = req.body || {};
    const patch: any = {};

    if (name !== undefined) patch.name = String(name);
    if (status !== undefined) {
      if (!isValidStatus(status)) {
        return res.status(400).json({
          error: `invalid status. allowed: ${STATUS_VALUES.join(", ")}`,
        });
      }
      patch.status = status;
    }
    if (customer !== undefined) patch.customer = customer;
    if (address !== undefined) patch.address = address;
    if (asset !== undefined) patch.asset = asset;
    if (visit !== undefined) patch.visit = visit;

    if (payments !== undefined) {
      patch.payments = normalizePayments(payments);
      patch.paymentsTotal = sumPayments(patch.payments);
    }
    if (notes !== undefined) patch.notes = String(notes ?? "");
    if (archived !== undefined) patch.archived = Boolean(archived);

    patch.updatedAt = Timestamp.now();

    await ref.update(patch);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/* ---------- POST /api/projects/:id/archive (ארכוב) ---------- */
router.post("/:id/archive", async (req, res) => {
  try {
    const userId = (req as any).userId as string;
    const ref = adminDb.collection("projects").doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists || doc.get("userId") !== userId) {
      return res.status(404).json({ error: "not found" });
    }
    await ref.update({ archived: true, updatedAt: Timestamp.now() });
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
