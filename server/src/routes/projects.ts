import { Router } from "express";
import { adminDb } from "../firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import { google } from "googleapis";
import {
  upsertGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
} from "../lib/googleCalendar";

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

function fmtHmInIL(d: Date): string {
  return new Intl.DateTimeFormat("he-IL", {
    timeZone: "Asia/Jerusalem",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

function buildCalendarTitle(opts: {
  addressText?: string | null;
  startsAt: Date;
  projectName?: string | null;
}) {
  const addr = (opts.addressText ?? "").trim();
  const time = fmtHmInIL(opts.startsAt);
  const tail = addr || (opts.projectName ?? "").trim() || "ללא כתובת";

  return `ביקור בנכס · ${time} · ${tail}`;
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

function finiteOrNull(x: any): number | null {
  const n = typeof x === "number" ? x : Number(x);
  return Number.isFinite(n) ? n : null;
}

// מסיר undefined עמוק (רק undefined! לא מוחק null/""/0)
function stripUndefinedDeep<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(stripUndefinedDeep) as any;
  }
  if (obj && typeof obj === "object") {
    const out: any = {};
    for (const [k, v] of Object.entries(obj as any)) {
      if (v === undefined) continue;
      out[k] = stripUndefinedDeep(v);
    }
    return out;
  }
  return obj;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toLocalDateInput(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function toLocalTimeInput(d: Date) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
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

      const firstName = String(customer?.firstName ?? "").trim();
      const lastName = String(customer?.lastName ?? "").trim();
      const legacyName = String(customer?.name ?? "").trim();

      const fullName =
        [firstName, lastName].filter(Boolean).join(" ").trim() || legacyName;

      tx.create(projectRef, {
        userId,
        name: name.trim(),
        status,
        archived: Boolean(archived),

        customer: {
          firstName,
          lastName,
          name: fullName,

          phone: customer?.phone ?? "",
          email: customer?.email ?? "",
          shippingEmail: customer?.shippingEmail ?? "",
          city: "",

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
          calendarResult = await upsertGoogleCalendarEvent({
            userId,
            title: buildCalendarTitle({
              addressText: v?.addressText ?? "",
              startsAt,
              projectName: name.trim(),
            }),

            addressText: v?.addressText ?? "",
            notes: v?.notes ?? "",
            contact: v?.contact ?? { role: "", name: "", phone: "" },
            nav: v?.nav ?? { googleMapsUrl: null, wazeUrl: null },

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

// GET /api/projects/:id
router.get("/:id", async (req, res) => {
  try {
    const userId = (req as any).userId as string;
    const projectId = req.params.id;

    const projectRef = adminDb.collection("projects").doc(projectId);
    const projectSnap = await projectRef.get();

    if (!projectSnap.exists)
      return res.status(404).json({ error: "not found" });
    if (projectSnap.get("userId") !== userId)
      return res.status(403).json({ error: "forbidden" });

    const project: any = { id: projectSnap.id, ...projectSnap.data() };

    // אם יש visitId - נטען את הביקור ונמיר לפורמט של הטופס
    const visitId = project.visitId as string | null | undefined;

    let visit: any = null;
    if (visitId) {
      const visitSnap = await adminDb.collection("visits").doc(visitId).get();
      if (visitSnap.exists) {
        const v: any = visitSnap.data();

        const startsAt: Date | null = v.startsAt?.toDate?.() ?? null;

        const visitDate = startsAt ? toLocalDateInput(startsAt) : "";
        const visitTime = startsAt ? toLocalTimeInput(startsAt) : "";

        visit = {
          contactRole: v?.contact?.role ?? "",
          contactName: v?.contact?.name ?? "",
          contactPhone: v?.contact?.phone ?? "",
          visitDate,
          visitTime,
          notes: v?.notes ?? "",
        };
      }
    }

    return res.json({ ...project, visit });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

/* ---------- PUT /api/projects/:id (עדכון חלקי + ביקור + יומן) ---------- */
router.put("/:id", async (req, res) => {
  try {
    const userId = (req as any).userId as string;
    const projectId = req.params.id;

    const projectRef = adminDb.collection("projects").doc(projectId);
    const visitsCol = adminDb.collection("visits");

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

    // ---- patch לפרויקט ----
    const projectPatch: any = {};

    if (name !== undefined) projectPatch.name = String(name);

    if (status !== undefined) {
      if (!isValidStatus(status)) {
        return res.status(400).json({
          error: `invalid status. allowed: ${STATUS_VALUES.join(", ")}`,
        });
      }
      projectPatch.status = status;
    }

    if (customer !== undefined) {
      const clean = stripUndefinedDeep(customer) as any;

      const firstName = String(clean?.firstName ?? "").trim();
      const lastName = String(clean?.lastName ?? "").trim();
      const legacyName = String(clean?.name ?? "").trim();

      const fullName =
        [firstName, lastName].filter(Boolean).join(" ").trim() || legacyName;

      projectPatch.customer = {
        ...clean,
        firstName,
        lastName,
        name: fullName,
        // cause we removed it so it will not collapse
        city: "",
      };
    }

    if (address !== undefined) {
      const cleanAddr = stripUndefinedDeep(address) as any;
      cleanAddr.lat = finiteOrNull(cleanAddr.lat);
      cleanAddr.lng = finiteOrNull(cleanAddr.lng);
      projectPatch.address = cleanAddr;
    }

    if (asset !== undefined) projectPatch.asset = stripUndefinedDeep(asset);

    if (payments !== undefined) {
      projectPatch.payments = normalizePayments(payments);
      projectPatch.paymentsTotal = sumPayments(projectPatch.payments);
    }

    if (notes !== undefined) projectPatch.notes = String(notes ?? "");
    if (archived !== undefined) projectPatch.archived = Boolean(archived);

    projectPatch.updatedAt = Timestamp.now();

    const parsed = toVisitTimestamps(visit?.visitDate, visit?.visitTime, 60);

    // ---- state יציב (מונע never + נוח ליומן אחרי טרנזקציה) ----
    type VisitForCalendar = {
      title: string;
      addressText: string;
      notes: string;
      contact: { role: string; name: string; phone: string };
      nav: { googleMapsUrl: string | null; wazeUrl: string | null };
      startsAt: Date;
      endsAt: Date;
    };

    const state: {
      finalVisitId: string | null;
      existingEventId?: string;
      removedEventId: string | null;
      visitForCalendar: VisitForCalendar | null;
      canceledVisitId: string | null; // כדי לנקות calendar במסמך אם ביטלנו
    } = {
      finalVisitId: null,
      existingEventId: undefined,
      removedEventId: null,
      visitForCalendar: null,
      canceledVisitId: null,
    };

    await adminDb.runTransaction(async (tx) => {
      const projSnap = await tx.get(projectRef);
      if (!projSnap.exists || projSnap.get("userId") !== userId) {
        const err: any = new Error("not found");
        err.status = 404;
        throw err;
      }

      const projectName = String(
        projectPatch.name ?? projSnap.get("name") ?? ""
      ).trim();

      const existingVisitId = (projSnap.get("visitId") as string) || null;
      const existingVisitRef = existingVisitId
        ? visitsCol.doc(existingVisitId)
        : null;
      const existingVisitSnap = existingVisitRef
        ? await tx.get(existingVisitRef)
        : null;

      if (existingVisitSnap?.exists) {
        const cal = existingVisitSnap.get("calendar") as any;
        state.existingEventId =
          typeof cal?.eventId === "string" && cal.eventId.trim()
            ? cal.eventId
            : undefined;
      } else {
        state.existingEventId = undefined;
      }

      // נחשב address לשימוש בביקור (אם נשלח patch -> הוא קודם)
      const mergedAddress =
        address !== undefined
          ? projectPatch.address
          : (projSnap.get("address") as any);

      const assessorName =
        asset !== undefined
          ? asset?.assessor
          : (projSnap.get("asset") as any)?.assessor ?? "";

      // תמיד מעדכנות פרויקט
      tx.update(projectRef, projectPatch);

      // --- ביטול ביקור ---
      if (!parsed) {
        if (existingVisitRef && existingVisitSnap?.exists) {
          state.removedEventId = state.existingEventId ?? null;
          state.canceledVisitId = existingVisitRef.id;

          tx.update(existingVisitRef, {
            status: "canceled",
            // כדי שלא נשאר עם eventId ישן בביקור שבוטל:
            calendar: null,
            updatedAt: Timestamp.now(),
          });

          tx.update(projectRef, {
            visitId: null,
            updatedAt: Timestamp.now(),
          });
        }

        state.finalVisitId = null;
        state.visitForCalendar = null;
        return;
      }

      // --- יצירה / עדכון ביקור ---
      const visitRefToUse = existingVisitRef ?? visitsCol.doc();

      const { addressText, googleMapsUrl, wazeUrl } = buildNavLinks({
        address: mergedAddress,
      });

      const visitPayload: any = {
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
        assessorName,

        addressText,
        lat: mergedAddress?.lat ?? null,
        lng: mergedAddress?.lng ?? null,
        nav: { googleMapsUrl, wazeUrl },

        status: "scheduled",
        updatedAt: Timestamp.now(),
      };

      if (existingVisitSnap?.exists) {
        tx.update(visitRefToUse, visitPayload);
      } else {
        tx.create(visitRefToUse, {
          ...visitPayload,
          calendar: null,
          createdAt: Timestamp.now(),
        });

        tx.update(projectRef, {
          visitId: visitRefToUse.id,
          updatedAt: Timestamp.now(),
        });

        state.existingEventId = undefined; // ביקור חדש => יצירה חדשה ביומן
      }

      state.finalVisitId = visitRefToUse.id;

      state.visitForCalendar = {
        title: buildCalendarTitle({
          addressText: visitPayload.addressText ?? "",
          startsAt: parsed.start,
          projectName,
        }),
        addressText: visitPayload.addressText ?? "",
        notes: visitPayload.notes ?? "",
        contact: visitPayload.contact ?? { role: "", name: "", phone: "" },
        nav: visitPayload.nav ?? { googleMapsUrl: null, wazeUrl: null },
        startsAt: parsed.start,
        endsAt: parsed.end,
      };
    });

    // ---------- יומן (לא מפיל שמירה) ----------
    let calendarResult: any = null;

    try {
      if (state.removedEventId) {
        calendarResult = await deleteGoogleCalendarEvent({
          userId,
          eventId: state.removedEventId,
        });
      } else if (state.finalVisitId && state.visitForCalendar) {
        const vfc = state.visitForCalendar;

        calendarResult = await upsertGoogleCalendarEvent({
          userId,
          existingEventId: state.existingEventId, // string | undefined
          title: vfc.title,
          addressText: vfc.addressText,
          notes: vfc.notes,
          contact: vfc.contact,
          nav: vfc.nav,
          startsAt: vfc.startsAt,
          endsAt: vfc.endsAt,
        });

        if (calendarResult?.ok) {
          await adminDb
            .collection("visits")
            .doc(state.finalVisitId)
            .set(
              {
                calendar: {
                  calendarId: "primary",
                  eventId: calendarResult.eventId,
                  htmlLink: calendarResult.htmlLink ?? null,
                },
                updatedAt: Timestamp.now(),
              },
              { merge: true }
            );
        }
      }
    } catch (e: any) {
      console.error("[projects.put] calendar failed:", e?.message);
      calendarResult = {
        ok: false,
        reason: "calendar_failed",
        detail: e?.message ?? "",
      };
    }

    return res.json({
      ok: true,
      visitId: state.finalVisitId,
      calendar: calendarResult,
    });
  } catch (e: any) {
    console.error("[projects.put] error:", e);
    const status = e?.status ?? 500;
    return res.status(status).json({ error: e?.message ?? "unknown error" });
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
