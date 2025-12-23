import { Router } from "express";
import { google } from "googleapis";
import { adminDb } from "../firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import crypto from "crypto";

const router = Router();

function getOAuthClient() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET!;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI!;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Missing Google OAuth env vars");
  }
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

router.get("/connect", async (req, res) => {
  try {
    const userId = (req as any).userId as string;
    if (!userId) return res.status(401).json({ error: "unauthorized" });

    const oauth2Client = getOAuthClient();
    const state = crypto.randomUUID();

    await adminDb
      .collection("oauthStates")
      .doc(state)
      .set({
        userId,
        createdAt: Timestamp.now(),
        // אופציונלי: TTL של שעה (אם יש לך TTL policy ב-Firestore)
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 60 * 60 * 1000)),
      });

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent select_account",
      include_granted_scopes: true,
      scope: ["https://www.googleapis.com/auth/calendar.events"],
      state,
    });

    return res.json({ url: authUrl });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "unknown error" });
  }
});

router.get("/callback", async (req, res) => {
  try {
    const code = String(req.query.code ?? "");
    const state = String(req.query.state ?? "");
    if (!code) return res.status(400).send("Missing code");
    if (!state) return res.status(400).send("Missing state");

    const stateDoc = await adminDb.collection("oauthStates").doc(state).get();
    if (!stateDoc.exists) return res.status(400).send("Invalid state");

    const userId = String(stateDoc.get("userId") ?? "");
    if (!userId) return res.status(400).send("Invalid state user");

    const oauth2Client = getOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);

    const base = process.env.APP_BASE_URL || "http://localhost:3000";

    console.log("[gcal] callback userId:", userId);
    console.log("[gcal] has refresh_token:", Boolean(tokens?.refresh_token));
    console.log("[gcal] redirectUri:", process.env.GOOGLE_OAUTH_REDIRECT_URI);

    if (!tokens.refresh_token) {
      // חשוב: לא מוחקים state כדי שתוכלי לנסות שוב אם צריך
      return res.redirect(`${base}/?gcal=missing_refresh_token`);
    }

    await adminDb
      .collection("users")
      .doc(userId)
      .collection("integrations")
      .doc("googleCalendar")
      .set(
        {
          refreshToken: tokens.refresh_token,
          scope: tokens.scope ?? null,
          connectedAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        },
        { merge: true }
      );

    await adminDb.collection("oauthStates").doc(state).delete();

    return res.redirect(`${base}/?gcal=connected`);
  } catch (e: any) {
    console.error("Google callback error:", e);
    res.status(500).send(e.message);
  }
});

router.get("/debug", async (req, res) => {
  const userId = (req as any).userId as string;
  const doc = await adminDb
    .collection("users")
    .doc(userId)
    .collection("integrations")
    .doc("googleCalendar")
    .get();

  return res.json({ exists: doc.exists, data: doc.data() ?? null });
});

router.get("/whoami", (req, res) => {
  res.json({ userId: (req as any).userId ?? null });
});

export default router;
