import { google } from "googleapis";
import { adminDb } from "../firebaseAdmin";

function getOAuthClient() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET!;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI!;
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export async function createGoogleCalendarEvent(params: {
  userId: string;
  title: string;
  description?: string;
  location?: string;
  startsAt: Date;
  endsAt: Date;
}) {
  const integSnap = await adminDb
    .collection("users")
    .doc(params.userId)
    .collection("integrations")
    .doc("googleCalendar")
    .get();

  const refreshToken = integSnap.get("refreshToken") as string | undefined;

  if (!refreshToken) {
    console.warn("[gcal] No refreshToken for user:", params.userId);
    return { ok: false, reason: "missing_refresh_token" as const };
  }

  try {
    const oauth2Client = getOAuthClient();
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const resp = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: params.title,
        description: params.description || "",
        location: params.location || "",
        start: {
          dateTime: params.startsAt.toISOString(),
          timeZone: "Asia/Jerusalem",
        },
        end: {
          dateTime: params.endsAt.toISOString(),
          timeZone: "Asia/Jerusalem",
        },
      },
    });

    return {
      ok: true,
      calendarId: "primary" as const,
      eventId: resp.data.id || null,
      htmlLink: resp.data.htmlLink || null,
    };
  } catch (e: any) {
    console.error("[gcal] Failed to create event", e?.response?.data || e);
    return {
      ok: false,
      reason: "api_error" as const,
      detail: e?.message ?? "",
    };
  }
}
