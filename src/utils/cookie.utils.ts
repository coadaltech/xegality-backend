export const set_auth_cookies = (
  cookie: any,
  access_token: string,
  refresh_token: string
) => {
  const isDevelopment =
    process.env.NODE_ENV === "development" || !process.env.NODE_ENV;
  const domain = isDevelopment ? undefined : ".xegality.com";

  cookie["refresh_token"].set({
    value: refresh_token,
    httpOnly: true,
    secure: true,
    sameSite: "none" as const,
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
    domain: domain,
    // domain: ".xegality.com",
  });
  cookie["access_token"].set({
    value: access_token,
    httpOnly: true,
    secure: true,
    sameSite: "none" as const,
    maxAge: 60 * 15,
    path: "/",
    domain: domain,
    // domain: ".xegality.com",
  });
};

export const clear_auth_cookies = (cookie: any) => {
  const isDevelopment =
    process.env.NODE_ENV === "development" || !process.env.NODE_ENV;
  const domain = isDevelopment ? undefined : ".xegality.com";

  cookie["refresh_token"].set({
    value: "",
    httpOnly: true,
    secure: true,
    sameSite: "none" as const,
    maxAge: 0,
    path: "/",
    domain: domain,
    // domain: ".xegality.com",
  });
  cookie["access_token"].set({
    value: "",
    httpOnly: true,
    secure: true,
    sameSite: "none" as const,
    maxAge: 0,
    path: "/",
    domain: domain,
    // domain: ".xegality.com",
  });
};
