const ALLOWED_DOMAINS = process.env.COOKIE_DOMAINS?.split(',') || ['.xegality.com'];
const FRONTEND_URL = process.env.FRONTEND_URL || '';

// Check if we're in development (localhost)
const isDevelopment = FRONTEND_URL.includes('localhost') || FRONTEND_URL.includes('127.0.0.1');

export const set_auth_cookies = (
  cookie: any,
  access_token: string,
  refresh_token: string
) => {
  if (isDevelopment) {
    // For localhost development: no domain, secure: false, sameSite: "lax"
    cookie["refresh_token"].set({
      value: refresh_token,
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    cookie["access_token"].set({
      value: access_token,
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });
  } else {
    // For production: use configured domains with secure: true and sameSite: "none"
    ALLOWED_DOMAINS.forEach(domain => {
      cookie["refresh_token"].set({
        value: refresh_token,
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
        domain: domain
      });
      cookie["access_token"].set({
        value: access_token,
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 60 * 60 * 24,
        path: "/",
        domain: domain
      });
    });
  }
};

export const clear_auth_cookies = (cookie: any) => {
  if (isDevelopment) {
    // For localhost development: no domain, secure: false, sameSite: "lax"
    cookie["refresh_token"].set({
      value: "",
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });
    cookie["access_token"].set({
      value: "",
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });
  } else {
    // For production: use configured domains with secure: true and sameSite: "none"
    ALLOWED_DOMAINS.forEach(domain => {
      cookie["refresh_token"].set({
        value: "",
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 0,
        path: "/",
        domain: domain
      });
      cookie["access_token"].set({
        value: "",
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 0,
        path: "/",
        domain: domain
      });
    });
  }
};
