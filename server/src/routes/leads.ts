import { Router } from "express";
import { adminDb } from "../firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";

const router = Router();

// GET /api/leads/stats -> { total, convertedCount, conversionRate }
router.get("/stats", async (req, res) => {
  try {
    const userId = (req as any).userId as string;
    const snap = await adminDb.collection("leads").where("userId", "==", userId).get();
    const total = snap.size;
    const convertedCount = snap.docs.filter(d => d.get("status") === "project").length;
    const conversionRate = total ? Math.round((convertedCount / total) * 100) : 0;
    res.json({ total, convertedCount, conversionRate });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/leads { name }
router.post("/", async (req, res) => {
  try {
    const userId = (req as any).userId as string;
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });

    const ref = await adminDb.collection("leads").add({
      userId,
      name,
      status: "lead",
      createdAt: Timestamp.now(),
    });
    res.json({ id: ref.id });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// PUT /api/leads/:id/convert
router.put("/:id/convert", async (req, res) => {
  try {
    const userId = (req as any).userId as string;
    const ref = adminDb.collection("leads").doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists || doc.get("userId") !== userId) return res.status(404).json({ error: "not found" });
    await ref.update({ status: "project", convertedAt: Timestamp.now() });
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
