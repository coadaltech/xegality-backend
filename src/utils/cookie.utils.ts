export const set_auth_cookies = (
  cookie: any,
  access_token: string,
  refresh_token: string
) => {
  cookie["refresh_token"].set({
    value: refresh_token,
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
    domain: ".xegality.com",
  });
  cookie["access_token"].set({
    value: access_token,
    httpOnly: true,
    secure: true,
    maxAge: 60 * 60 * 24,
    path: "/",
    sameSite: "none",
    domain: ".xegality.com",
  });
};

export const clear_auth_cookies = (cookie: any) => {
  cookie["refresh_token"].set({
    value: "",
    httpOnly: true,
    secure: true,
    maxAge: 0,
    path: "/",
    sameSite: "none",
    domain: ".xegality.com",
  });
  cookie["access_token"].set({
    value: "",
    httpOnly: true,
    secure: true,
    maxAge: 0,
    path: "/",
    sameSite: "none",
    domain: ".xegality.com",
  });
};
