import { Router } from "express";
import { adminDb } from "../firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";

const router = Router();

// GET /api/visits/next
router.get("/next", async (req, res) => {
  try {
    const userId = (req as any).userId as string;
    const now = Timestamp.now();
    const q = await adminDb.collection("visits")
      .where("userId", "==", userId)
      .where("when", ">=", now)
      .orderBy("when", "asc")
      .limit(1)
      .get();
    const doc = q.docs[0];
    res.json(doc ? { id: doc.id, ...doc.data() } : null);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// GET /api/visits/upcoming?days=7
router.get("/upcoming", async (req, res) => {
  try {
    const userId = (req as any).userId as string;
    const days = Number(req.query.days ?? 7);
    const now = new Date();
    const until = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const q = await adminDb.collection("visits")
      .where("userId", "==", userId)
      .where("when", ">=", Timestamp.fromDate(now))
      .where("when", "<", Timestamp.fromDate(until))
      .orderBy("when", "asc")
      .get();

    const items = q.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ count: items.length, items });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/visits { title, when(ISO), place? }
router.post("/", async (req, res) => {
  try {
    const userId = (req as any).userId as string;
    const { title, when, place } = req.body;
    if (!title || !when) return res.status(400).json({ error: "title & when required" });

    const ref = await adminDb.collection("visits").add({
      userId,
      title,
      place: place ?? null,
      when: Timestamp.fromDate(new Date(when)),
      createdAt: Timestamp.now(),
    });
    res.json({ id: ref.id });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
