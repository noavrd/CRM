import { Router } from "express";
import { adminDb } from "../firebaseAdmin";
import { hasRole } from "../lib/roles";

const router = Router();

// current user logged
router.get("/profile", async (req, res) => {
  try {
    const uid = (req as any).userId as string;
    const doc = await adminDb.collection("users").doc(uid).get();
    res.json(doc.exists ? { id: doc.id, ...doc.data() } : { id: uid });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// update profile after first login with google
router.post("/profile/init", async (req, res) => {
  try {
    const uid = (req as any).userId as string;
    const { displayName, email, photoURL, phone, locale, role } = req.body || {};
    await adminDb.collection("users").doc(uid).set(
      {
        displayName: displayName ?? null,
        email: email ?? null,
        photoURL: photoURL ?? null,
        phone: phone ?? null,
        locale: locale ?? null,
        role: role ?? null,
        updatedAt: new Date(),
      },
      { merge: true }
    );
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// update profile
router.patch("/profile", async (req, res) => {
  try {
    const uid = (req as any).userId as string;
    const allowed = ["displayName", "phone", "locale", "photoURL"] as const;
    const patch: Record<string, any> = {};
    for (const k of allowed) if (k in req.body) patch[k] = (req.body as any)[k];
    patch.updatedAt = new Date();
    await adminDb.collection("users").doc(uid).set(patch, { merge: true });
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// get user - only the user itself can, and user with permission (when we add office owner for example)
router.get("/:id", async (req, res) => {
  try {
    const requester = (req as any).userId as string;
    const target = req.params.id;

    if (requester !== target && !(await hasRole(requester, "admin"))) {
      return res.status(403).json({ error: "forbidden" });
    }

    const doc = await adminDb.collection("users").doc(target).get();
    if (!doc.exists) return res.status(404).json({ error: "not found" });

    res.json({ id: doc.id, ...doc.data() });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
