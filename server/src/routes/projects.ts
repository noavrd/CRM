import { Router } from "express";
import { adminDb } from "../firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";

const router = Router();

// GET /api/projects/stats -> { total, preVisit, postVisit }
router.get("/stats", async (req, res) => {
  try {
    const userId = (req as any).userId as string;
    const snap = await adminDb.collection("projects")
      .where("userId", "==", userId)
      .where("status", "==", "active")
      .get();

    const total = snap.size;
    let preVisit = 0, postVisit = 0;
    snap.forEach(d => {
      const stage = d.get("stage");
      if (stage === "pre_visit") preVisit++;
      if (stage === "post_visit") postVisit++;
    });

    res.json({ total, preVisit, postVisit });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST /api/projects { name, stage: "pre_visit" | "post_visit" }
router.post("/", async (req, res) => {
  try {
    const userId = (req as any).userId as string;
    const { name, stage } = req.body;
    if (!name || !["pre_visit", "post_visit"].includes(stage))
      return res.status(400).json({ error: "name & valid stage required" });

    const ref = await adminDb.collection("projects").add({
      userId,
      name,
      stage,
      status: "active",
      createdAt: Timestamp.now(),
    });
    res.json({ id: ref.id });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
