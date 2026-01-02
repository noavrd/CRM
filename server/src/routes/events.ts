import { Router } from "express";
import { google } from "googleapis";
import { adminDb } from "../firebaseAdmin";

const router = Router();

/* ---------- oauth + calendar client ---------- */
function getOAuthClient() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET!;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI!;
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

async function getCalendarClient(userId: string) {
  const integRef = adminDb
    .collection("users")
    .doc(userId)
    .collection("integrations")
    .doc("googleCalendar");

  const integSnap = await integRef.get();
  const refreshToken = integSnap.get("refreshToken") as string | undefined;

  if (!refreshToken) {
    return { ok: false as const, reason: "missing_refresh_token" as const };
  }

  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });
  return { ok: true as const, calendar };
}

/* ---------- helpers ---------- */
function safeIso(d: any): string | null {
  try {
    const dt = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(dt.getTime())) return null;
    return dt.toISOString();
  } catch {
    return null;
  }
}

/**
 * Google all-day events return start.date / end.date (end is exclusive).
 * We normalize to an ISO datetime so FullCalendar/Table won't "miss" them.
 */
function normalizeEventTimes(e: any) {
  const startIso =
    e.start?.dateTime ?? (e.start?.date ? `${e.start.date}T00:00:00` : null);

  const endIso =
    e.end?.dateTime ?? (e.end?.date ? `${e.end.date}T00:00:00` : null);

  return { startIso, endIso };
}

/* ---------- GET /api/events/debug ---------- */
/**
 * quick sanity check:
 * - returns integration existence + first 5 upcoming events
 * - use it when "range" returns empty
 */
router.get("/debug", async (req, res) => {
  try {
    const userId = (req as any).userId as string;

    const integSnap = await adminDb
      .collection("users")
      .doc(userId)
      .collection("integrations")
      .doc("googleCalendar")
      .get();

    const refreshToken = integSnap.get("refreshToken") as string | undefined;

    if (!refreshToken) {
      return res.json({ ok: false, reason: "missing_refresh_token" });
    }

    const client = await getCalendarClient(userId);
    if (!client.ok) return res.status(400).json(client);

    const nowIso = new Date().toISOString();
    const resp = await client.calendar.events.list({
      calendarId: "primary",
      timeMin: nowIso,
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 5,
      timeZone: "Asia/Jerusalem",
    });

    const sample = (resp.data.items ?? []).map((e) => {
      const { startIso, endIso } = normalizeEventTimes(e);
      return {
        id: e.id ?? "",
        summary: e.summary ?? "",
        start: startIso,
        end: endIso,
        htmlLink: e.htmlLink ?? null,
      };
    });

    return res.json({
      ok: true,
      hasIntegration: true,
      nowIso,
      count: sample.length,
      sample,
    });
  } catch (e: any) {
    console.error("[events.debug] error:", e);
    return res.status(500).json({ error: e?.message ?? "unknown error" });
  }
});

/* ---------- GET /api/events/range ---------- */
/**
 * GET /api/events/range?start=...&end=...
 * start/end MUST be ISO strings (FullCalendar sends Date objects -> we encodeURIComponent(toISOString()))
 */
router.get("/range", async (req, res) => {
  try {
    const userId = (req as any).userId as string;

    const startRaw = String(req.query.start ?? "");
    const endRaw = String(req.query.end ?? "");
    if (!startRaw || !endRaw) {
      return res.status(400).json({ error: "start and end are required" });
    }

    const startIso = safeIso(startRaw);
    const endIso = safeIso(endRaw);
    if (!startIso || !endIso) {
      return res.status(400).json({ error: "start/end must be valid dates" });
    }

    const client = await getCalendarClient(userId);
    if (!client.ok) return res.status(400).json(client);

    const resp = await client.calendar.events.list({
      calendarId: "primary",
      timeMin: startIso,
      timeMax: endIso,
      singleEvents: true,
      orderBy: "startTime",
      showDeleted: false,
      maxResults: 2500,
      timeZone: "Asia/Jerusalem",
    });

    const items = (resp.data.items ?? [])
      .filter((e) => !e.status || e.status !== "cancelled")
      .map((e) => {
        const { startIso: s, endIso: en } = normalizeEventTimes(e);

        return {
          id: e.id ?? "",
          title: e.summary ?? "(ללא כותרת)",
          startsAt: s,
          endsAt: en,
          htmlLink: e.htmlLink ?? null,
          location: e.location ?? null,
        };
      });

    return res.json(items);
  } catch (e: any) {
    console.error("[events.range] error:", e?.message, e?.response?.data);
    return res.status(500).json({ error: e?.message ?? "unknown error" });
  }
});

export default router;
