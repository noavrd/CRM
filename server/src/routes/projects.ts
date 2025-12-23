import { Router } from "express";
import { adminDb } from "../firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import { google } from "googleapis";
import { createGoogleCalendarEvent } from "../lib/googleCalendar";

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

function buildAddressText(project: any): string {
  const a = project?.address || {};
  return [[a.street, a.number].filter(Boolean).join(" "), a.city]
    .filter(Boolean)
    .join(", ");
}

function buildNavLinks(project: any) {
  const a = project?.address || {};
  const lat = a.lat;
  const lng = a.lng;
  const addressText = buildAddressText(project);

  // Google Maps
  const googleMapsUrl =
    lat != null && lng != null
      ? `https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}`
      : addressText
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          addressText
        )}`
      : null;

  // Waze
  const wazeUrl =
    lat != null && lng != null
      ? `https://waze.com/ul?ll=${encodeURIComponent(
          `${lat},${lng}`
        )}&navigate=yes`
      : addressText
      ? `https://waze.com/ul?q=${encodeURIComponent(addressText)}&navigate=yes`
      : null;

  return { addressText: addressText || null, googleMapsUrl, wazeUrl };
}

function toVisitTimestamps(
  visitDate?: string,
  visitTime?: string,
  durationMinutes = 60
) {
  if (!visitDate) return null;

  const time =
    visitTime && String(visitTime).trim() ? String(visitTime).trim() : "09:00";
  const start = new Date(`${visitDate}T${time}:00`);
  if (Number.isNaN(start.getTime())) return null;

  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  return { start, end, durationMinutes };
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
      status,
      customer,
      address,
      asset,
      visit,
      payments,
      notes,
      archived,
      clientRequestId: clientRequestIdRaw,
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

    const clientRequestId =
      typeof clientRequestIdRaw === "string" && clientRequestIdRaw.trim()
        ? clientRequestIdRaw.trim()
        : null;

    const projectRef = clientRequestId
      ? adminDb.collection("projects").doc(`${userId}_${clientRequestId}`)
      : adminDb.collection("projects").doc();

    // check if visit needed
    const parsed = toVisitTimestamps(visit?.visitDate, visit?.visitTime, 60);
    const visitsCol = adminDb.collection("visits");
    const visitRef = parsed ? visitsCol.doc(`project_${projectRef.id}`) : null;

    let createdVisitId: string | null = null;
    let alreadyExisted = false;

    await adminDb.runTransaction(async (tx) => {
      const projectSnap = await tx.get(projectRef);

      let visitSnap: FirebaseFirestore.DocumentSnapshot | null = null;
      if (visitRef) {
        visitSnap = await tx.get(visitRef);
      }

      // אם הפרויקט כבר קיים (אותו clientRequestId) -> לא ליצור שוב
      if (projectSnap.exists) {
        alreadyExisted = true;
        createdVisitId = (projectSnap.get("visitId") as string) || null;
        return;
      }

      tx.create(projectRef, {
        userId,
        name: name.trim(),
        status,
        archived: Boolean(archived),

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

        address: {
          city: address?.city ?? "",
          street: address?.street ?? "",
          neighborhood: address?.neighborhood ?? "",
          number: address?.number ?? "",
          apt: address?.apt ?? "",
          block: address?.block ?? "",
          parcel: address?.parcel ?? "",
          subParcel: address?.subParcel ?? "",
          plot: address?.plot ?? "",
          lat: address?.lat ?? null,
          lng: address?.lng ?? null,
        },

        asset: {
          floor: asset?.floor ?? "",
          rooms: asset?.rooms ?? "",
          areaSqm: asset?.areaSqm ?? "",
          propertyType: asset?.propertyType ?? "",
          usage: asset?.usage ?? "",
          purpose: asset?.purpose ?? "",
          appraisalDueDate: asset?.appraisalDueDate ?? "",
          submissionDueDate: asset?.submissionDueDate ?? "",
          assessor: asset?.assessor ?? "",
          referrer: asset?.referrer ?? "",
        },

        payments: safePayments,
        paymentsTotal: total,
        notes: notes ?? "",

        visitId: null,

        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      if (parsed && visitRef) {
        const { addressText, googleMapsUrl, wazeUrl } = buildNavLinks({
          address,
        });

        // אם משום מה הביקור כבר קיים (ריטריי) - לא ליצור שוב
        if (!visitSnap?.exists) {
          tx.create(visitRef, {
            userId,
            projectId: projectRef.id,

            startsAt: Timestamp.fromDate(parsed.start),
            endsAt: Timestamp.fromDate(parsed.end),
            durationMinutes: parsed.durationMinutes,

            contact: {
              role: visit?.contactRole ?? "",
              name: visit?.contactName ?? "",
              phone: visit?.contactPhone ?? "",
            },

            notes: visit?.notes ?? "",
            assessorName: asset?.assessor ?? "",

            addressText,
            lat: address?.lat ?? null,
            lng: address?.lng ?? null,

            nav: { googleMapsUrl, wazeUrl },
            status: "scheduled",
            calendar: null,

            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });
        }

        tx.update(projectRef, {
          visitId: visitRef.id,
          updatedAt: Timestamp.now(),
        });

        createdVisitId = visitRef.id;
      }
    });

    let calendarResult: any = null;

    if (createdVisitId) {
      const visitDoc = await adminDb
        .collection("visits")
        .doc(createdVisitId)
        .get();
      if (visitDoc.exists) {
        const v = visitDoc.data() as any;
        const startsAt: Date | null = v.startsAt?.toDate?.() ?? null;
        const endsAt: Date | null = v.endsAt?.toDate?.() ?? null;

        if (startsAt && endsAt) {
          calendarResult = await createGoogleCalendarEvent({
            userId,
            title: `ביקור בנכס – ${name.trim()}`,
            description: v?.notes ? `הערות: ${v.notes}` : "",
            location: v?.addressText ?? "",
            startsAt,
            endsAt,
          });

          if (calendarResult?.ok && calendarResult?.eventId) {
            await adminDb
              .collection("visits")
              .doc(createdVisitId)
              .set(
                {
                  calendar: {
                    calendarId: calendarResult.calendarId,
                    eventId: calendarResult.eventId,
                    htmlLink: calendarResult.htmlLink,
                  },
                  updatedAt: Timestamp.now(),
                },
                { merge: true }
              );
          }
        }
      }
    }

    return res.json({
      id: projectRef.id,
      visitId: createdVisitId,
      alreadyExisted,
      calendar: calendarResult,
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
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

router.post("/:id/visits", async (req, res) => {
  try {
    const userId = (req as any).userId as string;
    const projectId = req.params.id;
    const body = req.body || {};

    // תומך גם ב-startsAt וגם ב-date+time
    let startsAtIso = String(body.startsAt ?? "");
    if (!startsAtIso) {
      const d = String(body.date ?? "");
      const t = String(body.time ?? "");
      if (d) {
        const time = t && t.trim() ? t.trim() : "09:00";
        startsAtIso = new Date(`${d}T${time}:00`).toISOString();
      }
    }

    if (!startsAtIso) {
      return res
        .status(400)
        .json({ error: "startsAt (or date+time) is required" });
    }

    const projectRef = adminDb.collection("projects").doc(projectId);
    const visitsCol = adminDb.collection("visits");

    let out: any = null;

    await adminDb.runTransaction(async (tx) => {
      const projSnap = await tx.get(projectRef);
      if (!projSnap.exists) {
        throw new Error("project not found");
      }
      if (projSnap.get("userId") !== userId) {
        const err: any = new Error("forbidden");
        err.status = 403;
        throw err;
      }

      const existingVisitId = projSnap.get("visitId") as string | undefined;

      // ✅ אם כבר יש ביקור מקושר לפרויקט — לא יוצרים עוד אחד ולא מחזירים 409
      if (existingVisitId) {
        const visitRef = visitsCol.doc(existingVisitId);
        const visitSnap = await tx.get(visitRef);
        out = {
          id: visitRef.id,
          ...(visitSnap.exists ? visitSnap.data() : {}),
        };
        return;
      }

      // ✅ יוצרים ביקור חדש ומקשרים אותו לפרויקט באותה טרנזקציה
      const visitRef = visitsCol.doc();

      const durationMinutes = Number(body?.durationMinutes ?? 60);
      const startDate = new Date(startsAtIso);
      const endsAt = new Date(
        startDate.getTime() + durationMinutes * 60 * 1000
      );

      const payload = {
        userId,
        projectId,
        startsAt: Timestamp.fromDate(startDate),
        endsAt: Timestamp.fromDate(endsAt),
        durationMinutes,

        assessorName: body?.assessorName ?? null,
        status: body?.status ?? "scheduled",

        contact: body?.contact ?? {},
        notes: body?.notes ?? "",
        instructions: body?.instructions ?? "",
        parkingInfo: body?.parkingInfo ?? "",

        // בהמשך נמלא את זה מהפרויקט (addressText/nav וכו’) אם תרצי
        addressText: body?.addressText ?? null,
        nav: body?.nav ?? {},

        calendar: body?.calendar ?? null,

        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      tx.set(visitRef, payload);
      tx.update(projectRef, {
        visitId: visitRef.id,
        updatedAt: Timestamp.now(),
      });

      out = { id: visitRef.id, ...payload };
    });

    // ממירים timestamps ל-ISO כדי שהפרונט לא יתבאס
    if (out?.startsAt?.toDate)
      out.startsAt = out.startsAt.toDate().toISOString();
    if (out?.endsAt?.toDate) out.endsAt = out.endsAt.toDate().toISOString();

    return res.status(200).json(out);
  } catch (e: any) {
    const status = e?.status ?? 500;
    return res.status(status).json({ error: e?.message ?? "unknown error" });
  }
});

export default router;
