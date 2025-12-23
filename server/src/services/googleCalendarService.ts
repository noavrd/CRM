import { google } from "googleapis";

export function getGoogleCalendarClient(opts: {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  refreshToken: string;
}) {
  const oauth2Client = new google.auth.OAuth2(
    opts.clientId,
    opts.clientSecret,
    opts.redirectUri
  );

  oauth2Client.setCredentials({ refresh_token: opts.refreshToken });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });
  return { calendar };
}
