import { Router } from "express";
import { google } from "googleapis";

const router = Router();

function getOAuthClient() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Missing Google OAuth env vars");
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

// 1) מתחיל את החיבור (מחזיר URL ל-consent)
router.get("/connect", async (req, res) => {
  try {
    const userId = (req as any).userId as string; // אצלך כבר קיים middleware שמוסיף
    if (!userId) return res.status(401).json({ error: "unauthorized" });

    const oauth2Client = getOAuthClient();

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: ["https://www.googleapis.com/auth/calendar.events"],
      state: userId, // נשמור את userId כדי לדעת למי לשייך callback
    });

    res.json({ url: authUrl });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 2) callback שגוגל מחזיר אליו עם code
router.get("/callback", async (req, res) => {
  try {
    const code = String(req.query.code ?? "");
    const state = String(req.query.state ?? ""); // userId
    if (!code) return res.status(400).send("Missing code");
    if (!state) return res.status(400).send("Missing state");

    const oauth2Client = getOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);

    // בשלב 1 רק נוודא שזה עובד
    console.log("Google tokens:", {
      hasAccessToken: Boolean(tokens.access_token),
      hasRefreshToken: Boolean(tokens.refresh_token),
      scope: tokens.scope,
      expiry_date: tokens.expiry_date,
    });

    // חשוב: refresh_token מתקבל רק בפעם הראשונה או עם prompt=consent
    if (!tokens.refresh_token) {
      console.warn(
        "No refresh_token returned. Try removing app access and reconnecting."
      );
    }

    const base = process.env.APP_BASE_URL || "http://localhost:5173";
    return res.redirect(`${base}/?gcal=connected`);
  } catch (e: any) {
    console.error("Google callback error:", e);
    res.status(500).send(e.message);
  }
});

export default router;
