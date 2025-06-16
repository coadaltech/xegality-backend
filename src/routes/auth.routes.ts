import { Elysia, t } from "elysia";
import {
  handle_google_callback,
  handle_login,
  handle_login_by_token,
  otp_cycle,
} from "../services/shared/user.service";
import {
  create_user,
  generate_otp,
  verify_otp,
} from "../services/shared/otp.service";
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
import { random_otp, verify_refresh_token } from "../utils";

const auth_routes = new Elysia({ prefix: "/auth" })

  // signup routes
  // 1
  .post(
    "/signup",
    async ({ body, set }) => {
      const { phone, email } = body;
      if (!phone && !email) {
        set.status = 400;
        return {
          success: false,
          code: 404,
          message: "Either phone or email must be provided.",
        };
      }

      const value = phone ?? email;
      if (!value) {
        return {
          success: false,
          message: "Value is neither Phone nor Email",
        };
      }
      const otp_response = await otp_cycle(value);
      if (otp_response.code == 200 && otp_response.success) {
        set.status = otp_response.code;
        return otp_response;
      }
    },
    { body: SignupSchema }
  )
  // 2
  .post(
    "/verify-otp",
    async ({ body, set }) => {
      const { phone, email } = body;
      if (!phone && !email) {
        set.status = 400;
        return {
          success: false,
          code: 404,
          message: "Either phone or email must be provided.",
        };
      }

      const value = phone ?? email;
      if (!value) {
        return {
          success: false,
          message: "Value is neither Phone nor Email",
        };
      }

      const otpResponse = await verify_otp(body.otp, value);
      if (otpResponse.success == false) {
        set.status = otpResponse.code;
        return otpResponse;
      }
      const creating_user_response = await create_user(
        body.name,
        body.password,
        body.role,
        body.phone,
        body.email
      );
      if (!creating_user_response?.success) {
        set.status = creating_user_response?.code;
        return creating_user_response;
      }
      set.status = creating_user_response.code;
      return creating_user_response;
    },
    { body: OtpSchema }
  )

  // login routes
  // 1
  .post(
    "/login",
    async ({ body, set, cookie }) => {
      const existing_token = cookie["refresh_token"]?.value;

      if (existing_token) {
        const { valid, payload } = verify_refresh_token(existing_token);

        if (
          valid &&
          payload &&
          typeof payload === "object" &&
          "id" in payload
        ) {
          const login_response = await handle_login_by_token(payload);
          set.status = 200;
          return {
            success: true,
            message: "Already logged In",
            data: {
              id: login_response.data?.id,
              name: login_response.data?.name,
              access_token: login_response.data?.access_token,
            },
          };
        }
      }
      if (!body.phone && !body.email) {
        set.status = 400;
        return {
          success: false,
          code: 404,
          message: "Either phone or email must be provided.",
        };
      }
      const value = body.phone ?? body.email;
      if (!value) {
        return {
          success: false,
          message: "Value is neither Phone nor Email",
        };
      }
      const response = await handle_login(body.password, value);
      if (
        response.success &&
        response.data?.refresh_token &&
        response.data?.access_token
      ) {
        cookie["refresh_token"].set({
          value: response.data.refresh_token,
          httpOnly: true,
          secure: true,
          maxAge: 60 * 60 * 24 * 7,
          path: "/",
        });
        cookie["access_token"].set({
          value: response.data.access_token,
          httpOnly: true,
          secure: true,
          maxAge: 60 * 15,
          path: "/",
        });
      }

      set.status = response?.code;
      return response;
    },
    { body: LoginSchema }
  )

  // google login routes
  .get("/google-login", ({ query }) => {
    const { role } = query;
    if (!role) {
      return { succes: false, code: 404, message: "Missing Role In Query" };
    }
    if (role !== "consumer" && role !== "lawyer" && role !== "student") {
      return { succes: false, code: 404, message: "Invalid Role In Query" };
    }
    return get_consent_url(role);
  })
  .get(
    "/google-callback",
    async ({ query }) => {
      const response = await handle_google_callback({
        query,
      });
      console.log(response);
      
      return response;
    },
    {
      query: t.Object({
        code: t.String(),
        state: t.String(),
      }),
    }
  )

  // logout route
  .post("/logout", async ({ cookie, set }) => {
    const existing_token = cookie["refresh_token"].value;
    if (!existing_token) {
      set.status = 404;
      return {
        success: true,
        message: "Already Logged Out",
      };
    }
    cookie["refresh_token"].remove();
    set.status = 200;
    return {
      success: true,
      message: "Logged Out Successfully",
    };
  });
export default auth_routes;
