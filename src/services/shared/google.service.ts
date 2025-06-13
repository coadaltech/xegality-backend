import { google } from "googleapis";
import "dotenv/config";

const oauthClient = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);
const scopes = ["profile", "email"];

const get_consent_url = (role: string) =>
  oauthClient.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    state: JSON.stringify({ role }),
  });

const get_tokens = async (code: string) => {
  const { tokens } = await oauthClient.getToken(code);
  console.log("[SERVER.AUTH] Tokens received:", tokens);

  return {
    id_token: tokens.id_token,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token!,
  };
};

const get_new_id_token = async (refreshToken: string) => {
  oauthClient.setCredentials({ refresh_token: refreshToken });
  const tokens = await oauthClient.refreshAccessToken();
  return tokens.credentials.id_token;
};

const get_user_info = async (idToken: string) => {
  try {
    const ticket = await oauthClient.verifyIdToken({ idToken });
    const payload = ticket.getPayload();
    return {
      userId: payload?.sub,
      email: payload?.email,
      name: payload?.name,
      profile_pic: payload?.picture,
    };
  } catch (error) {
    console.error("[SERVER.AUTH] Error verifying ID token:", error);
    return null;
  }
};

export {
  oauthClient,
  get_consent_url,
  get_tokens,
  get_new_id_token,
  get_user_info,
};
