import { Router } from "express";
import { adminDb } from "../firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";

const router = Router();

const DEFAULT_DAYS = 7;
const MAX_DAYS = 60;
const LIMIT_SCAN = 250; // כמה ביקורים להביא למשתמש ואז לסנן בזיכרון (בלי אינדקס)

function clampDays(v: any) {
  const n = Number(v);
  if (!Number.isFinite(n)) return DEFAULT_DAYS;
  return Math.max(1, Math.min(MAX_DAYS, Math.floor(n)));
}

function startsAtToMs(x: any): number | null {
  try {
    const d: Date | null = x?.toDate?.() ?? null;
    if (!d) return null;
    const ms = d.getTime();
    return Number.isFinite(ms) ? ms : null;
  } catch {
    return null;
  }
}

function toIsoOrNullTs(x: any): string | null {
  try {
    const iso = x?.toDate?.()?.toISOString?.();
    return typeof iso === "string" ? iso : null;
  } catch {
    return null;
  }
}

// GET /api/visits/upcoming?days=7
router.get("/upcoming", async (req, res) => {
  try {
    const userId = (req as any).userId as string | undefined;
    if (!userId) return res.status(401).json({ error: "unauthorized" });

    const days = clampDays(req.query.days);
    const now = new Date();
    const nowMs = now.getTime();
    const untilMs = nowMs + days * 24 * 60 * 60 * 1000;

    // ✅ בלי אינדקס: מביאים ביקורים של המשתמש בלבד (אין startsAt בתנאי)
    const snap = await adminDb
      .collection("visits")
      .where("userId", "==", userId)
      .limit(LIMIT_SCAN)
      .get();

    const docs = snap.docs;

    // נבנה רשימה גולמית + נסנן שבוע קדימה + נמיין בזיכרון
    const filteredDocs = docs
      .map((d) => {
        const data: any = d.data();
        const ms = startsAtToMs(data.startsAt);
        return { d, data, ms };
      })
      .filter((x) => x.ms !== null && x.ms >= nowMs && x.ms < untilMs)
      .sort((a, b) => a.ms! - b.ms!);

    // projectIds להצגת שם פרויקט
    const projectIds = Array.from(
      new Set(filteredDocs.map((x) => x.data.projectId).filter(Boolean))
    ) as string[];

    const projectsSnap = projectIds.length
      ? await adminDb.getAll(
          ...projectIds.map((id) => adminDb.collection("projects").doc(id))
        )
      : [];

    const projectNameById = new Map<string, string>();
    projectsSnap.forEach((p) => {
      if (p.exists) projectNameById.set(p.id, String(p.get("name") ?? ""));
    });

    const items = filteredDocs.map((x) => {
      const projectId = x.data.projectId ?? null;

      return {
        id: x.d.id,
        projectId,
        projectName: projectId
          ? projectNameById.get(String(projectId)) ?? ""
          : "",

        startsAt: toIsoOrNullTs(x.data.startsAt),
        endsAt: toIsoOrNullTs(x.data.endsAt),
        durationMinutes: x.data.durationMinutes ?? 60,

        assessorName: x.data.assessorName ?? null,
        status: x.data.status ?? "scheduled",

        contact: x.data.contact ?? {},
        notes: x.data.notes ?? "",
        instructions: x.data.instructions ?? "",
        parkingInfo: x.data.parkingInfo ?? "",

        addressText: x.data.addressText ?? null,
        nav: x.data.nav ?? {},
        calendar: x.data.calendar ?? null,
      };
    });

    res.json({ count: items.length, items });
  } catch (e: any) {
    console.error("GET /api/visits/upcoming error:", e);
    res.status(500).json({ error: e?.message || "internal error" });
  }
});

// GET /api/visits/next?days=7
router.get("/next", async (req, res) => {
  try {
    const userId = (req as any).userId as string | undefined;
    if (!userId) return res.status(401).json({ error: "unauthorized" });

    const days = clampDays(req.query.days);
    const now = new Date();
    const nowMs = now.getTime();
    const untilMs = nowMs + days * 24 * 60 * 60 * 1000;

    const snap = await adminDb
      .collection("visits")
      .where("userId", "==", userId)
      .limit(LIMIT_SCAN)
      .get();

    const docs = snap.docs
      .map((d) => {
        const data: any = d.data();
        const ms = startsAtToMs(data.startsAt);
        return { d, data, ms };
      })
      .filter((x) => x.ms !== null && x.ms >= nowMs && x.ms < untilMs)
      .sort((a, b) => a.ms! - b.ms!);

    const first = docs[0];
    if (!first) return res.json({ count: 0, items: [] });

    const projectId = first.data.projectId ?? null;
    let projectName = "";
    if (projectId) {
      const p = await adminDb
        .collection("projects")
        .doc(String(projectId))
        .get();
      if (p.exists) projectName = String(p.get("name") ?? "");
    }

    const item = {
      id: first.d.id,
      projectId,
      projectName,

      startsAt: toIsoOrNullTs(first.data.startsAt),
      endsAt: toIsoOrNullTs(first.data.endsAt),
      durationMinutes: first.data.durationMinutes ?? 60,

      assessorName: first.data.assessorName ?? null,
      status: first.data.status ?? "scheduled",

      contact: first.data.contact ?? {},
      notes: first.data.notes ?? "",
      instructions: first.data.instructions ?? "",
      parkingInfo: first.data.parkingInfo ?? "",

      addressText: first.data.addressText ?? null,
      nav: first.data.nav ?? {},
      calendar: first.data.calendar ?? null,
    };

    res.json({ count: 1, items: [item] });
  } catch (e: any) {
    console.error("GET /api/visits/next error:", e);
    res.status(500).json({ error: e?.message || "internal error" });
  }
});

export default router;
