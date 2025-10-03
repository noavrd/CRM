import { Router } from "express";
import { adminDb } from "../firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";

const router = Router();

// GET /api/tasks/open
router.get("/open", async (req, res) => {
  try {
    const userId = (req as any).userId as string;
    const snap = await adminDb.collection("tasks")
      .where("userId", "==", userId)
      .where("done", "==", false)
      .orderBy("due", "asc")
      .get();

    res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/tasks { title, due(ISO) }
router.post("/", async (req, res) => {
  try {
    const userId = (req as any).userId as string;
    const { title, due } = req.body;
    if (!title || !due) return res.status(400).json({ error: "title & due required" });

    const ref = await adminDb.collection("tasks").add({
      userId,
      title,
      due: Timestamp.fromDate(new Date(due)),
      done: false,
      createdAt: Timestamp.now(),
    });
    res.json({ id: ref.id });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// PUT /api/tasks/:id/done
router.put("/:id/done", async (req, res) => {
  try {
    const userId = (req as any).userId as string;
    const ref = adminDb.collection("tasks").doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists || doc.get("userId") !== userId) return res.status(404).json({ error: "not found" });

    await ref.update({ done: true });
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
