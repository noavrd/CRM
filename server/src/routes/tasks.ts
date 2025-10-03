import { Router } from "express";
import { adminDb } from "../firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";

const router = Router();

// get all tasks for user
router.get("/", async (req, res) => {
  try {
    const userId = (req as any).userId as string;

    // maybe add filter by status
    const snap = await adminDb
      .collection("tasks")
      .where("userId", "==", userId)
      .orderBy("dueDate", "asc") 
      .get();

    const items = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        projectId: data.projectId ?? "",
        assignee: data.assignee ?? null,
        description: data.description ?? "",
        status: data.status ?? "todo",
        dueDate: data.dueDate ? (data.dueDate as Timestamp).toDate().toISOString().slice(0, 10) : null,
      };
    });

    res.json(items);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// create new task
router.post("/", async (req, res) => {
  try {
    const userId = (req as any).userId as string;
    const { projectId, assignee, dueDate, description, status } = req.body || {};

    if (!projectId) return res.status(400).json({ error: "projectId is required" });
    if (!description || typeof description !== "string" || !description.trim()) {
      return res.status(400).json({ error: "description is required" });
    }

    const dueTs =
      dueDate ? Timestamp.fromDate(new Date(dueDate)) : null;

    const ref = await adminDb.collection("tasks").add({
      userId,
      projectId,
      assignee: assignee ?? null,
      description: description.trim(),
      status: status ?? "todo",
      dueDate: dueTs,
      createdAt: Timestamp.now(),
    });

    res.json({ id: ref.id });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// update task
router.put("/:id", async (req, res) => {
  try {
    const userId = (req as any).userId as string;
    const ref = adminDb.collection("tasks").doc(req.params.id);
    const doc = await ref.get();

    if (!doc.exists || doc.get("userId") !== userId) {
      return res.status(404).json({ error: "not found" });
    }

    const patch: any = {};
    const { projectId, assignee, dueDate, description, status } = req.body || {};

    if (projectId !== undefined) patch.projectId = projectId;
    if (assignee !== undefined) patch.assignee = assignee;
    if (description !== undefined) patch.description = String(description);
    if (status !== undefined) patch.status = status;
    if (dueDate !== undefined) {
      patch.dueDate = dueDate ? Timestamp.fromDate(new Date(dueDate)) : null;
    }

    await ref.update(patch);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// mark as done
router.put("/:id/done", async (req, res) => {
  try {
    const userId = (req as any).userId as string;
    const ref = adminDb.collection("tasks").doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists || doc.get("userId") !== userId) return res.status(404).json({ error: "not found" });

    await ref.update({ status: "done" });
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
