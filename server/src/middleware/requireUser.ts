import { Request, Response, NextFunction } from "express";
import { getAuth } from "firebase-admin/auth";

export async function requireUser(req: Request, res: Response, next: NextFunction) {
  try {
    const authz = req.headers.authorization || "";
    const token = authz.startsWith("Bearer ") ? authz.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing Authorization Bearer token" });

    const decoded = await getAuth().verifyIdToken(token);
    (req as any).userId = decoded.uid;
    next();
  } catch (e: any) {
    return res.status(401).json({ error: "Invalid token", detail: e?.message });
  }
}
