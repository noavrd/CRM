import { google } from "googleapis";
import { adminDb } from "../firebaseAdmin";

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
    console.warn("[gcal] No refreshToken for user:", userId);
    return { ok: false as const, reason: "missing_refresh_token" as const };
  }

  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });
  return { ok: true as const, calendar };
}

/** Result types */
export type UpsertGoogleCalendarEventResult =
  | {
      ok: true;
      calendarId: "primary";
      eventId: string;
      htmlLink: string | null;
      action: "created" | "updated";
    }
  | {
      ok: false;
      reason: "missing_refresh_token" | "api_error";
      detail?: string;
    };

export async function upsertGoogleCalendarEvent(params: {
  userId: string;
  existingEventId?: string; // אם אין — עושים insert
  title: string;
  description?: string;
  location?: string;
  startsAt: Date;
  endsAt: Date;
}): Promise<UpsertGoogleCalendarEventResult> {
  const client = await getCalendarClient(params.userId);
  if (!client.ok) return client;

  const requestBody = {
    summary: params.title,
    description: params.description || "",
    location: params.location || "",
    start: { dateTime: params.startsAt.toISOString() },
    end: { dateTime: params.endsAt.toISOString() },
  };

  try {
    if (params.existingEventId) {
      const resp = await client.calendar.events.patch({
        calendarId: "primary",
        eventId: params.existingEventId,
        requestBody,
      });

      // אם גוגל לא מחזיר id, נשארים עם הישן (עדיין string)
      const eventId = resp.data.id ?? params.existingEventId;

      console.log("[gcal] Updated event:", eventId, resp.data?.htmlLink);

      return {
        ok: true,
        calendarId: "primary",
        eventId,
        htmlLink: resp.data.htmlLink ?? null,
        action: "updated",
      };
    }

    const resp = await client.calendar.events.insert({
      calendarId: "primary",
      requestBody,
    });

    const eventId = resp.data.id;
    if (!eventId) {
      // לא מחזירים ok:true בלי eventId
      return {
        ok: false,
        reason: "api_error",
        detail: "Google Calendar insert returned no event id",
      };
    }

    console.log("[gcal] Created event:", eventId, resp.data?.htmlLink);

    return {
      ok: true,
      calendarId: "primary",
      eventId,
      htmlLink: resp.data.htmlLink ?? null,
      action: "created",
    };
  } catch (e: any) {
    console.error("[gcal] Upsert failed", {
      message: e?.message,
      status: e?.code,
      errors: e?.errors,
      response: e?.response?.data,
    });

    return {
      ok: false,
      reason: "api_error",
      detail: e?.message ?? "",
    };
  }
}

export async function deleteGoogleCalendarEvent(params: {
  userId: string;
  eventId: string;
}): Promise<
  | { ok: true }
  | {
      ok: false;
      reason: "missing_refresh_token" | "api_error";
      detail?: string;
    }
> {
  const client = await getCalendarClient(params.userId);
  if (!client.ok) return client;

  try {
    await client.calendar.events.delete({
      calendarId: "primary",
      eventId: params.eventId,
    });

    console.log("[gcal] Deleted event:", params.eventId);

    return { ok: true };
  } catch (e: any) {
    console.error("[gcal] Delete failed", {
      message: e?.message,
      status: e?.code,
      errors: e?.errors,
      response: e?.response?.data,
    });

    return {
      ok: false,
      reason: "api_error",
      detail: e?.message ?? "",
    };
  }
}
