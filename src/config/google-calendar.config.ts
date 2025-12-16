import { google } from "googleapis";

export interface GoogleCalendarConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export const GOOGLE_CALENDAR_CONFIG: GoogleCalendarConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID || "",
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  redirectUri:
    process.env.GOOGLE_CALENDAR_REDIRECT_URI ||
    "http://localhost:4000/api/lawyer/google-calendar/callback",
  scopes: [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
  ],
};

export const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CALENDAR_CONFIG.clientId,
  GOOGLE_CALENDAR_CONFIG.clientSecret,
  GOOGLE_CALENDAR_CONFIG.redirectUri
);

export const calendar = google.calendar({ version: "v3", auth: oauth2Client });

export const getAuthUrl = (state?: string) => {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: GOOGLE_CALENDAR_CONFIG.scopes,
    state: state || "google_calendar_auth",
    prompt: "consent",
  });
};

export const getAccessToken = async (code: string) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    return tokens;
  } catch (error) {
    console.error("Error getting access token:", error);
    throw error;
  }
};

export const refreshAccessToken = async (refreshToken: string) => {
  try {
    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    const { credentials } = await oauth2Client.refreshAccessToken();
    return credentials;
  } catch (error) {
    console.error("Error refreshing access token:", error);
    throw error;
  }
};
