import { Router } from "express";
import { adminDb } from "../firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";

const router = Router();

// get all tasks for user
router.get("/", async (req, res) => {
  try {
    const userId = (req as any).userId as string | undefined;
    if (!userId) return res.status(401).json({ error: "unauthorized" });

    // maybe add filter by status - check
    const snap = await adminDb
      .collection("tasks")
      .where("userId", "==", userId)
      .get();

    // בונים מערך גולמי
    const items = snap.docs.map((d) => {
      const data = d.data();
      const dueTs = (data.dueDate as Timestamp | null | undefined) ?? null;
      return {
        id: d.id,
        projectId: data.projectId ?? "",
        assignee: data.assignee ?? null,
        description: data.description ?? "",
        title: data.title ?? "",
        status: data.status ?? "todo",
        // נחזיר כ-YYYY-MM-DD כדי לשמור עקביות עם ה-FE
        dueDate: dueTs ? dueTs.toDate().toISOString().slice(0, 10) : null,
      };
    });

    // מיון בזיכרון: תאריכים קודם, null בסוף
    items.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });

    res.json({ items });
  } catch (e: any) {
    console.error("GET /api/tasks error:", e);
    res.status(500).json({ error: e?.message || "internal error" });
  }
});

// create new task
router.post("/", async (req, res) => {
  try {
    const userId = (req as any).userId as string | undefined;
    if (!userId) return res.status(401).json({ error: "unauthorized" });

    const { projectId, assignee, dueDate, title, description, status } =
      req.body || {};

    const normalizedProjectId =
      typeof projectId === "string" && projectId.trim()
        ? projectId.trim()
        : null;

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "title is required" });
    }
    if (
      !description ||
      typeof description !== "string" ||
      !description.trim()
    ) {
      return res.status(400).json({ error: "description is required" });
    }

    // מצפות ל-YYYY-MM-DD או ISO מלא; new Date() יטפל בשניהם
    const dueTs = dueDate ? Timestamp.fromDate(new Date(dueDate)) : null;

    const ref = await adminDb.collection("tasks").add({
      userId,
      projectId: normalizedProjectId,
      assignee: assignee ?? null,
      title: title.trim(),
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
    const userId = (req as any).userId as string | undefined;
    if (!userId) return res.status(401).json({ error: "unauthorized" });

    const ref = adminDb.collection("tasks").doc(req.params.id);
    const doc = await ref.get();

    if (!doc.exists || doc.get("userId") !== userId) {
      return res.status(404).json({ error: "not found" });
    }

    const patch: any = {};
    const { projectId, assignee, dueDate, title, description, status } =
      req.body || {};

    if (projectId !== undefined) {
      patch.projectId =
        typeof projectId === "string" && projectId.trim()
          ? projectId.trim()
          : null;
    }
    if (assignee !== undefined) patch.assignee = assignee;
    if (description !== undefined) patch.description = String(description);
    if (title !== undefined) patch.title = String(title);
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
    const userId = (req as any).userId as string | undefined;
    if (!userId) return res.status(401).json({ error: "unauthorized" });

    const ref = adminDb.collection("tasks").doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists || doc.get("userId") !== userId)
      return res.status(404).json({ error: "not found" });

    await ref.update({ status: "done" });
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
