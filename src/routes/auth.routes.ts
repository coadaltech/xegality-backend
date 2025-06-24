import { Elysia } from "elysia";
import {
  create_tokens,
  generate_otp,
  handle_google_callback,
  handle_login,
  handle_login_by_otp,
  handle_login_by_token,
  verify_token_with_db,
} from "../services/shared/auth.service";
import { verify_otp } from "../services/shared/otp.service";
import {
  LoginSchema,
  VerifyUserSchema,
  GenerateOtpSchema,
  GoogleCallbackSchema,
  VerifyLoginOtpSchema,
} from "../types/auth.types";
import { get_consent_url } from "../services/shared/google.service";
import { verify_access_token, verify_refresh_token } from "../utils";
import { create_user } from "../services/shared/user.service";

const auth_routes = new Elysia({ prefix: "/auth" })

  // LOGIN
  .post(
    "/login",
    async ({ body, set, cookie }) => {
      const now = new Date().toLocaleString();
      const existing_token = cookie["access_token"]?.value;

      try {
        // Already logged in check
        if (existing_token) {
          const { valid, payload } = verify_access_token(existing_token);

          if (
            valid &&
            payload &&
            typeof payload === "object" &&
            "id" in payload
          ) {
            const login_response = await handle_login_by_token(payload);
            set.status = login_response.code;
            console.log(`[SERVER]    Already Logged In @ ${now}`);
            return login_response;
          }
        }

        const { phone, email, password } = body;

        if (!phone && !email) {
          set.status = 400;
          console.warn(`[SERVER]    Phone or Email Missing @ ${now}`);
          return {
            success: false,
            code: 400,
            message: "Either phone or email must be provided.",
          };
        }

        const value = phone ?? email;

        if (!value || !password) {
          set.status = 400;
          console.warn(`[SERVER]    Invalid login input @ ${now}`);
          return {
            success: false,
            code: 400,
            message: "Invalid phone/email or password.",
          };
        }

        // Attempt login
        const response = await handle_login(password, value);

        if (
          response.success &&
          response.data?.refresh_token &&
          response.data?.access_token
        ) {
          // Set tokens
          cookie["refresh_token"].set({
            value: response.data.refresh_token,
            httpOnly: true,
            secure: true,
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: "/",
          });

          cookie["access_token"].set({
            value: response.data.access_token,
            httpOnly: true,
            secure: true,
            maxAge: 60 * 60, // 1 hour
            path: "/",
          });

          console.log(`[SERVER]    Set Tokens to Cookies @ ${now}`);
        }

        console.log(`[SERVER]    Login Attempt Processed @ ${now}`);
        set.status = response.code;
        return response;
      } catch (error) {
        console.error(`[SERVER]    Login Failed @ ${now}`);
        console.error(`[ERROR]`, error);
        set.status = 500;
        return {
          success: false,
          code: 500,
          message: "Internal Server Error during login.",
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
    { body: LoginSchema }
  )
  .post(
    "/verify-login-otp",
    async ({ body, set }) => {
      const now = new Date().toLocaleString();
      const { phone, email, otp } = body;

      if (!phone && !email) {
        set.status = 400;
        console.warn(`[SERVER]    Email or Phone Missing @ ${now}`);
        return {
          success: false,
          code: 400,
          message: "Either phone or email must be provided.",
        };
      }

      const value = phone ?? email;

      if (!value || !otp) {
        set.status = 400;
        console.warn(`[SERVER]    Invalid Email, Phone, or OTP @ ${now}`);
        return {
          success: false,
          code: 400,
          message: "Invalid email, phone, or OTP.",
        };
      }

      const otp_response = await verify_otp(otp, value);

      if (!otp_response.success) {
        set.status = otp_response.code;
        console.warn(`[SERVER]    OTP is Invalid @ ${now}`);
        return otp_response;
      }
      console.log(`[SERVER]    OTP Verified Successfully @ ${now}`);
      const login_response = await handle_login_by_otp(value);
      set.status = login_response.code;
      return login_response;
    },
    { body: VerifyLoginOtpSchema }
  )

  // SIGNUP
  .post(
    "/generate-otp",
    async ({ body, set, query }) => {
      const { mode } = query;
      const now = new Date().toLocaleString();
      const { phone, email } = body;

      if (!phone && !email) {
        console.warn(`[SERVER]    Missing Phone or Email @ ${now}`);
        set.status = 400;
        return {
          success: false,
          code: 400,
          message: "Either phone or email must be provided.",
        };
      }

      const value = phone ?? email;
      const isPhone = typeof value === "number";
      const label = isPhone ? "Phone" : "Email";

      if (!value || (typeof value !== "string" && typeof value !== "number")) {
        console.warn(
          `[SERVER]    Invalid ${label} provided: ${value} @ ${now}`
        );
        set.status = 400;
        return {
          success: false,
          code: 400,
          message: `Invalid ${label} provided.`,
        };
      }

      try {
        const otp_response = await generate_otp(value, mode);
        set.status = otp_response.code;
        return otp_response;
      } catch (err) {
        console.error(
          `[SERVER]    OTP generation failed for ${label}: ${value} @ ${now}`
        );
        console.error(`[ERROR]`, err);
        set.status = 500;
        return {
          success: false,
          code: 500,
          message: `Internal Server Error while generating OTP for ${label.toLowerCase()}`,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    },
    { body: GenerateOtpSchema }
  )
  .post(
    "/verify-signup-otp",
    async ({ body, set, cookie }) => {
      const { phone, email, name, password, role, otp } = body;
      const now = new Date().toLocaleString();

      // Check for valid identity
      if (!phone && !email) {
        set.status = 400;
        console.log(`[SERVER]    Phone or Email Missing @ ${now}`);
        return {
          success: false,
          code: 400,
          message: "Either phone or email must be provided.",
        };
      }

      const value = phone ?? email;
      const isPhone = typeof value === "number";
      const label = isPhone ? "Phone" : "Email";

      if (!value || (typeof value !== "string" && typeof value !== "number")) {
        set.status = 400;
        console.log(`[SERVER]    Invalid ${label} Provided @ ${now}`);
        return {
          success: false,
          code: 400,
          message: `Invalid ${label} provided.`,
        };
      }

      // Verify OTP
      const otpResponse = await verify_otp(otp, value);
      if (!otpResponse.success) {
        set.status = otpResponse.code;
        console.log(
          `[SERVER]    OTP Verification Failed for ${label}: ${value} @ ${now}`
        );
        return otpResponse;
      }

      console.log(`[SERVER]    OTP Verified for ${label}: ${value} @ ${now}`);

      // Create User
      const creating_user_response = await create_user(
        name,
        password,
        role,
        phone,
        email
      );

      if (!creating_user_response?.success) {
        set.status = creating_user_response?.code || 500;
        console.log(`[SERVER]    User Creation Failed @ ${now}`);
        return creating_user_response;
      }

      // Set Tokens in Cookies
      const tokens = creating_user_response.data;
      if (tokens?.refresh_token && tokens?.access_token) {
        cookie["refresh_token"].set({
          value: tokens.refresh_token,
          httpOnly: true,
          secure: true,
          maxAge: 60 * 60 * 24 * 7, // 7 days
          path: "/",
        });
        cookie["access_token"].set({
          value: tokens.access_token,
          httpOnly: true,
          secure: true,
          maxAge: 60 * 60, // 1 hour
          path: "/",
        });

        console.log(`[SERVER]    Set Tokens to Cookies @ ${now}`);
      }

      set.status = creating_user_response.code;
      console.log(`[SERVER]    User Created Successfully @ ${now}`);
      return creating_user_response;
    },
    { body: VerifyUserSchema }
  )

  .post("/refresh-tokens", async ({ cookie, set, headers }) => {
    const now = new Date().toLocaleString();

    try {
      let refresh_token = cookie?.refresh_token.value;

      // Fallback to Authorization header if cookie not present
      if (!refresh_token) {
        const authHeader = headers?.authorization;
        if (authHeader?.startsWith("Bearer ")) {
          refresh_token = authHeader.replace("Bearer ", "").trim();
        }
      }

      // If still no token, return error
      if (!refresh_token) {
        console.warn(`[SERVER]    No Refresh Token Found @ ${now}`);
        set.status = 401;
        return {
          success: false,
          code: 401,
          message: "No refresh token provided.",
        };
      }
      // Validate refresh token against DB
      const validation_response = await verify_token_with_db(
        String(refresh_token)
      );

      if (!validation_response.success) {
        set.status = validation_response.code;
        console.warn(`[SERVER]    Invalid Refresh Token @ ${now}`);
        return validation_response;
      }

      // Generate new tokens
      const token_result = await create_tokens(
        validation_response.data!.id,
        validation_response.data!.role
      );

      if (!token_result.success) {
        set.status = token_result.code;
        console.error(`[SERVER]    Token Creation Failed @ ${now}`);
        return token_result;
      }

      const { new_access_token, new_refresh_token } = token_result.data || {};

      // Set new tokens in cookies
      if (new_refresh_token && new_access_token) {
        cookie["refresh_token"].set({
          value: new_refresh_token,
          httpOnly: true,
          secure: true,
          maxAge: 60 * 60 * 24 * 7, // 7 days
          path: "/",
        });

        cookie["access_token"].set({
          value: new_access_token,
          httpOnly: true,
          secure: true,
          maxAge: 60 * 60, // 1 hour
          path: "/",
        });

        console.log(`[SERVER]    Set Tokens to Cookies @ ${now}`);
      }

      set.status = token_result.code;
      console.log(`[SERVER]    Token Creation Success @ ${now}`);
      return token_result;
    } catch (error) {
      console.error(`[SERVER]    Refresh Token Handling Failed @ ${now}`);
      console.error(`[ERROR]`, error);
      set.status = 500;
      return {
        success: false,
        code: 500,
        message: "Failed to refresh tokens due to server error.",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  })

  // GOOGLE LOGIN
  .get("/google-login", ({ query }) => {
    const { role } = query;
    if (!role) {
      console.log(`[SERVER]   No Role : ${new Date().toLocaleString()}`);
      return { succes: false, code: 404, message: "Missing Role In Query" };
    }
    if (role !== "consumer" && role !== "lawyer" && role !== "student") {
      console.log(`[SERVER]   Invalid Role : ${new Date().toLocaleString()}`);
      return { succes: false, code: 404, message: "Invalid Role In Query" };
    }
    const link = get_consent_url(role);
    console.log(
      `[SERVER]    Consent Link Generated : ${new Date().toLocaleString()}`
    );
    return { link };
  })
  .get(
    "/google-callback",
    async ({ query, cookie }) => {
      const response = await handle_google_callback({
        query,
      });
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
          maxAge: 60 * 60,
          path: "/",
        });
        console.log(
          `[SERVER]   Set Tokens to Cookies : ${new Date().toLocaleString()}`
        );
      }
      console.log(
        `[SERVER]    Google Login Success : ${new Date().toLocaleString()}`
      );
      return response;
    },
    {
      query: GoogleCallbackSchema,
    }
  )
  .get("/logout", async ({ cookie, set }) => {
    const now = new Date().toLocaleString();
    const refreshToken = cookie["refresh_token"]?.value;
    const accessToken = cookie["access_token"]?.value;

    if (!refreshToken && !accessToken) {
      set.status = 200;
      console.log(`[SERVER]    Already Logged Out @ ${now}`);
      return {
        success: true,
        code: 200,
        message: "Already logged out.",
      };
    }

    cookie["refresh_token"].remove();
    cookie["access_token"].remove();

    set.status = 200;
    console.log(`[SERVER]    Logged Out Successfully @ ${now}`);
    return {
      success: true,
      code: 200,
      message: "Logged out successfully.",
    };
  });
export default auth_routes;
