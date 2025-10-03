import { Router } from "express";
import { adminDb } from "../firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";

const router = Router();

// GET /api/events/month?year=2025&month=10
router.get("/month", async (req, res) => {
  try {
    const userId = (req as any).userId as string;
    const year = Number(req.query.year);
    const month = Number(req.query.month); // 1..12
    if (!year || !month) return res.status(400).json({ error: "year & month required" });

    const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const end   = new Date(Date.UTC(year, month, 1, 0, 0, 0));

    const q = await adminDb.collection("events")
      .where("userId", "==", userId)
      .where("date", ">=", Timestamp.fromDate(start))
      .where("date", "<", Timestamp.fromDate(end))
      .orderBy("date", "asc")
      .get();

    res.json(q.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/events { title, date(ISO) }
router.post("/", async (req, res) => {
  try {
    const userId = (req as any).userId as string;
    const { title, date } = req.body;
    if (!title || !date) return res.status(400).json({ error: "title & date required" });

    const ref = await adminDb.collection("events").add({
      userId,
      title,
      date: Timestamp.fromDate(new Date(date)),
      createdAt: Timestamp.now(),
    });
    res.json({ id: ref.id });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
