import { Elysia, t } from "elysia";
import {
  handle_google_callback,
  handle_login,
  handle_signup,
} from "../services/shared/user.service";
import { generate_otp, verify_otp } from "../services/shared/otp.service";
import {
  LoginSchema,
  OtpSchema,
  RoleType,
  SignupSchema,
} from "../types/auth.types";
import {
  get_consent_url,
  get_tokens,
  get_user_info,
} from "../services/shared/google.service";

const auth_routes = new Elysia({ prefix: "/auth" })
  .post(
    "/login",
    async ({ body, set }) => {
      const response = await handle_login(
        body.password,
        body?.phone,
        body?.email
      );

      set.status = response?.code;
      return response;
    },
    { body: LoginSchema }
  )
  .post(
    "/generate-otp",
    async ({ body, set }) => {
      const otpResponse = await generate_otp(body.phone);
      set.status = otpResponse.code;
      return otpResponse;
    },
    {
      body: t.Object({
        phone: t.Number(),
      }),
    }
  )
  .post(
    "/verify-otp",
    async ({ body, set }) => {
      const otpResponse = await verify_otp(body.otp, body.phone);
      if (otpResponse.success == false) {
        set.status = otpResponse.code;
        return otpResponse;
      }
      set.status = otpResponse.code;
      return otpResponse;
    },
    { body: OtpSchema }
  )
  .post(
    "/signup",
    async ({ body, set }) => {
      const response = await handle_signup(
        body.name,
        body.password,
        body.phone,
        body.role,
        body.email
      );

      set.status = response?.code;
      return response;
    },
    { body: SignupSchema }
  )
  .get("/google-login", ({ query }) => {
    const { role } = query;
    if (!role) return "Missing role in query";
    return get_consent_url(role);
  })
  .get(
    "/google-callback",
    async ({ query }) => {
      const response = await handle_google_callback({
        query,
      });
      return response;
    },
    {
      query: t.Object({
        code: t.String(),
        state: t.String(),
      }),
    }
  );

export default auth_routes;
