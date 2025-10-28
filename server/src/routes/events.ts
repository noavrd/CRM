import { Router } from "express";
import { adminDb } from "../firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";

const router = Router();

// טיפוסי עזר
const CONTACT_ROLES = ["client", "broker", "lawyer", "other"] as const;
type ContactRole = (typeof CONTACT_ROLES)[number];

// GET /api/events - רשימת כל האירועים (לצורך הטעינה אחרי שמירה)
router.get("/", async (req, res) => {
  try {
    const userId = (req as any).userId as string;

    const q = await adminDb
      .collection("events")
      .where("userId", "==", userId)
      .orderBy("date", "desc")
      .limit(30)
      .get();

    const items = q.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    res.json(items);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// -------- GET /api/events/month?year=2025&month=10 --------
// שליפה לפי חודש קלנדר (משתמשים בשדות y/m)
// GET /api/events/month?year=2025&month=10
// GET /api/events/month?year=2025&month=10
router.get("/month", async (req, res) => {
  try {
    const userId = (req as any).userId as string;
    const year = Number(req.query.year);
    const month = Number(req.query.month);
    if (!year || !month)
      return res.status(400).json({ error: "year & month required" });

    const q = await adminDb
      .collection("events")
      .where("userId", "==", userId)
      .where("y", "==", year)
      .where("m", "==", month)
      // .orderBy("startsAt","asc")  // הסירו כדי לא לדרוש אינדקס
      .get();

    const items = q.docs.map((d) => {
      const x = d.data();
      const dt: Date | undefined = x?.startsAt?.toDate?.();
      return {
        id: d.id,
        title: x.title ?? "",
        startsAt: dt ? dt.toISOString() : null,
        contact: x.contact ?? {},
        notes: x.notes ?? "",
        projectId: x.projectId ?? "",
      };
    });

    res.json(items);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// -------- POST /api/events --------
// body:
// {
//   title: string,
//   date: "YYYY-MM-DD",         // חובה
//   time?: "HH:mm",             // אופציונלי (ברירת מחדל 00:00)
//   contact?: { role?: "client"|"broker"|"lawyer"|"other", name?: string, phone?: string },
//   notes?: string,
//   projectId?: string
// }
router.post("/", async (req, res) => {
  try {
    const userId = (req as any).userId as string;
    const { title, date, time, contact, notes, projectId } = req.body || {};

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "title is required" });
    }
    if (!date || typeof date !== "string") {
      return res.status(400).json({ error: "date (YYYY-MM-DD) is required" });
    }

    // מרכיבים תאריך+שעה מקומיים → אובייקט Date מקומי → נשמר UTC
    const hhmm =
      typeof time === "string" && /^\d{2}:\d{2}$/.test(time) ? time : "00:00";
    // פורמט "YYYY-MM-DDTHH:mm" יפורש כ-local time ע"י JS
    const local = new Date(`${date}T${hhmm}:00`);
    const startsAt = Timestamp.fromDate(local);

    // מפצלים ל-y/m/day (לשאילתות חודשיות ללא הטיות טיימזון)
    const [y, m, day] = [
      local.getFullYear(),
      local.getMonth() + 1,
      local.getDate(),
    ];

    const doc = {
      userId,
      title: title.trim(),
      startsAt, // שדה זמנים העיקרי
      y,
      m,
      day, // עזר לשאילתות
      contact: {
        role: CONTACT_ROLES.includes(contact?.role) ? contact.role : "",
        name: contact?.name ?? "",
        phone: contact?.phone ?? "",
      },
      notes: notes ?? "",
      projectId: projectId ?? "",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const ref = await adminDb.collection("events").add(doc);
    return res.json({ id: ref.id });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// -------- PUT /api/events/:id -------- (עדכון חלקי)
router.put("/:id", async (req, res) => {
  try {
    const userId = (req as any).userId as string;
    const ref = adminDb.collection("events").doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists || snap.get("userId") !== userId) {
      return res.status(404).json({ error: "not found" });
    }

    const { title, date, time, contact, notes, projectId } = req.body || {};
    const patch: any = {};

    if (title !== undefined) patch.title = String(title);

    if (date !== undefined || time !== undefined) {
      const current = snap.get("startsAt")?.toDate?.() as Date | undefined;
      const base = current ?? new Date();
      const d =
        typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)
          ? date
          : [
              base.getFullYear().toString().padStart(4, "0"),
              (base.getMonth() + 1).toString().padStart(2, "0"),
              base.getDate().toString().padStart(2, "0"),
            ].join("-");
      const t =
        typeof time === "string" && /^\d{2}:\d{2}$/.test(time)
          ? time
          : [
              base.getHours().toString().padStart(2, "0"),
              base.getMinutes().toString().padStart(2, "0"),
            ].join(":");

      const local = new Date(`${d}T${t}:00`);
      patch.startsAt = Timestamp.fromDate(local);
      patch.y = local.getFullYear();
      patch.m = local.getMonth() + 1;
      patch.day = local.getDate();
    }

    if (contact !== undefined) {
      patch.contact = {
        role: CONTACT_ROLES.includes(contact?.role)
          ? contact.role
          : snap.get("contact")?.role ?? "",
        name: contact?.name ?? snap.get("contact")?.name ?? "",
        phone: contact?.phone ?? snap.get("contact")?.phone ?? "",
      };
    }

    if (notes !== undefined) patch.notes = String(notes ?? "");
    if (projectId !== undefined) patch.projectId = String(projectId ?? "");

    patch.updatedAt = Timestamp.now();

    await ref.update(patch);
    return res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
