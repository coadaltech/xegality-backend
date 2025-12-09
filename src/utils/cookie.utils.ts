const isDev = process.env.NODE_ENV === "development";

export const set_auth_cookies = (
  cookie: any,
  access_token: string,
  refresh_token: string
) => {
  cookie["refresh_token"].set({
    value: refresh_token,
    httpOnly: true,
    secure: !isDev,
    sameSite: isDev ? "lax" : "none",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
    ...(isDev ? {} : { domain: ".xegality.com" }),
  });
  cookie["access_token"].set({
    value: access_token,
    httpOnly: true,
    secure: !isDev,
    maxAge: 60 * 60 * 24,
    path: "/",
    sameSite: isDev ? "lax" : "none",
    ...(isDev ? {} : { domain: ".xegality.com" }),
  });
};

export const clear_auth_cookies = (cookie: any) => {
  cookie["refresh_token"].set({
    value: "",
    httpOnly: true,
    secure: !isDev,
    maxAge: 0,
    path: "/",
    sameSite: isDev ? "lax" : "none",
    ...(isDev ? {} : { domain: ".xegality.com" }),
  });
  cookie["access_token"].set({
    value: "",
    httpOnly: true,
    secure: !isDev,
    maxAge: 0,
    path: "/",
    sameSite: isDev ? "lax" : "none",
    ...(isDev ? {} : { domain: ".xegality.com" }),
  });
};
