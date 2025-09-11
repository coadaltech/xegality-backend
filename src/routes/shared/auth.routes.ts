import { Elysia } from "elysia";
import { otp_cycle, verify_token_with_db, create_tokens, handle_login_by_token, handle_login, handle_google_callback } from "../../services/shared/auth.service";
import { get_consent_url } from "../../services/shared/google.service";
import { verify_otp } from "../../services/shared/otp.service";
import { create_user } from "../../services/shared/user.service";
import { GenerateOtpSchema, VerifyUserSchema, LoginSchema, VerifyLoginOtpSchema, GoogleCallbackSchema } from "../../types/auth.types";
import { verify_access_token } from "@/utils/general.utils";

const auth_routes = new Elysia({ prefix: "/auth" })
  // SIGNUP
  .post(
    "/generate-otp",
    async ({ body, set }) => {
      const { phone, email } = body;
      if (!phone && !email) {
        set.status = 400;
        console.log(`[SERVER]   Phone or Email Missing : ${new Date().toLocaleString()}`);
        return {
          success: false,
          code: 404,
          message: "Either phone or email must be provided.",
        };
      }

      const value = phone ?? email;
      if (!value) {
        console.log(
          `[SERVER]   Invalid Phone or Email : ${new Date().toLocaleString()}`
        );
        return {
          success: false,
          message: "Value is neither Phone nor Email",
        };
      }
      const otp_response = await otp_cycle(value);
      console.log(otp_response);
      if (otp_response.code == 200 && otp_response.success) {
        set.status = otp_response.code;
        console.log(`[SERVER]   OTP Send : ${new Date().toLocaleString()}`);
        return otp_response;
      }
    },
    { body: GenerateOtpSchema }
  )

  .post(
    "/verify-signup-otp",
    async ({ body, set, cookie }) => {
      const { phone, email, name, password, role, otp } = body;
      if (!phone && !email) {
        set.status = 400;
        console.log(
          `[SERVER]  Phone or Email Missing : ${new Date().toLocaleString()}`
        );
        return {
          success: false,
          code: 404,
          message: "Either phone or email must be provided.",
        };
      }

      const value = phone ?? email;
      if (!value) {
        console.log(
          `[SERVER]   Invalid Phone or Email : ${new Date().toLocaleString()}`
        );
        return {
          success: false,
          message: "Value is neither Phone nor Email",
        };
      }

      const otpResponse = await verify_otp(otp, value);
      if (otpResponse.success == false) {
        set.status = otpResponse.code;
        console.log(`[SERVER]   OTP Verified : ${new Date().toLocaleString()}`);
        return otpResponse;
      }
      const create_user_res = await create_user(
        name,
        password,
        role,
        phone,
        email
      );
      if (!create_user_res?.success) {
        set.status = create_user_res?.code;
        console.log(
          `[SERVER]   User Creation Failed : ${new Date().toLocaleString()}`
        );
        return create_user_res;
      }
      set.status = create_user_res.code;
      if (
        create_user_res.success &&
        create_user_res.data?.refresh_token &&
        create_user_res.data?.access_token
      ) {
        cookie["refresh_token"].set({
          value: create_user_res.data.refresh_token,
          httpOnly: true,
          secure: true,
          maxAge: 60 * 60 * 24 * 7,
          path: "/",
        });
        cookie["access_token"].set({
          value: create_user_res.data.access_token,
          httpOnly: true,
          secure: true,
          maxAge: 60 * 60 * 24,
          path: "/",
        });
        console.log(`[SERVER]   Set Tokens to Cookies : ${new Date().toLocaleString()}`);
      }

      console.log(`[SERVER]   User Created Success : ${new Date().toLocaleString()}`);
      return create_user_res;
    },
    { body: VerifyUserSchema }
  )

  // REFRESH TOKENS
  .get("/refresh-tokens", async ({ cookie, set }) => {
    const refresh_token = cookie.refresh_token;
    if (!refresh_token) {
      console.log(`[SERVER]   No Refresh Token Found : ${new Date().toLocaleString()}`);
      return {
        success: true,
        code: 404,
        message: "No Refresh Token",
      };
    }

    const validation_response = await verify_token_with_db(
      String(refresh_token)
    );
    if (!validation_response.success) {
      set.status = validation_response.code;
      console.log(`[SERVER]   Invalid Refresh Token : ${new Date().toLocaleString()}`);
      return validation_response;
    }
    const data = await create_tokens(
      validation_response.data?.id!,
      validation_response.data?.role!,
      validation_response.data?.is_profile_complete!
    );
    if (!data?.success) {
      set.status = data?.code;
      console.log(`[SERVER]   Token Creation Failed : ${new Date().toLocaleString()}`);
      return data;
    }
    set.status = data.code;
    if (
      data.success &&
      data.data?.new_access_token &&
      data.data?.new_refresh_token
    ) {
      cookie["refresh_token"].set({
        value: data.data?.new_refresh_token,
        httpOnly: true,
        secure: true,
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });
      cookie["access_token"].set({
        value: data.data?.new_refresh_token,
        httpOnly: true,
        secure: true,
        maxAge: 60 * 60 * 24,
        path: "/",
      });
      console.log(`[SERVER]   Set Tokens to Cookies : ${new Date().toLocaleString()}`);
    }
    set.status = data.code;
    console.log(`[SERVER]   Token Creation Success : ${new Date().toLocaleString()}`);
    return data;
  })

  // LOGIN
  .post(
    "/login",
    async ({ body, set, cookie }) => {
      const existing_token = cookie["access_token"]?.value;

      if (existing_token) {
        const { valid, payload } = verify_access_token(existing_token);
        if (
          valid &&
          payload &&
          typeof payload === "object" &&
          "id" in payload
        ) {
          const login_response = await handle_login_by_token(payload);
          set.status = 200;
          console.log(
            `[SERVER]   Already Logged In : ${new Date().toLocaleString()}`
          );
          // return {
          //   success: true,
          //   code: 201,
          //   message: "Already logged In",
          //   data: {
          //     id: login_response.data?.id,
          //     name: login_response.data?.name,
          //     access_token: login_response.data?.access_token,
          //   },
          // };
          return login_response;
        }
      }
      if (!body.phone && !body.email) {
        set.status = 400;
        console.log(`[SERVER]   Phone or Email Missing : ${new Date().toLocaleString()}`);
        return {
          success: false,
          code: 404,
          message: "Either phone or email must be provided.",
        };
      }
      const value = body.phone ?? body.email;
      if (!value) {
        console.log(`[SERVER]   Invalid Email or : ${new Date().toLocaleString()}`);
        return {
          success: false,
          code: 401,
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
          maxAge: 60 * 60 * 24,
          path: "/",
        });
        console.log(`[SERVER]   Set Tokens to Cookies : ${new Date().toLocaleString()}`);
      }
      console.log(`[SERVER]   Update Tokens : ${new Date().toLocaleString()}`);
      set.status = response?.code;
      return response;
    },
    { body: LoginSchema }
  )
  .post(
    "/verify-login-otp",
    async ({ body, set }) => {
      const { phone, email } = body;
      if (!phone && !email) {
        set.status = 400;
        console.log(`[SERVER]   Email or Phone Missing : ${new Date().toLocaleString()}`);
        return {
          success: false,
          code: 404,
          message: "Either phone or email must be provided.",
        };
      }

      const value = phone ?? email;
      if (!value) {
        console.log(`[SERVER]   Invalid Email or Phone : ${new Date().toLocaleString()}`);
        return {
          success: false,
          message: "Value is neither Phone nor Email",
        };
      }

      const otpResponse = await verify_otp(body.otp, value);
      if (otpResponse.success == false) {
        set.status = otpResponse.code;
        console.log(`[SERVER]   OTP is Invalid : ${new Date().toLocaleString()}`);
        return otpResponse;
      }
    },
    { body: VerifyLoginOtpSchema }
  )

  // GOOGLE LOGIN
  .get("/google-login", ({ query }) => {
    const { role } = query;
    if (!role) {
      console.log(`[SERVER]   No Role : ${new Date().toLocaleString()}`);
      return { succes: false, code: 404, message: "Missing Role In Query" };
    }
    if (role !== "consumer" && role !== "lawyer" && role !== "student" && role === "paralegal") {
      console.log(`[SERVER]   Invalid Role : ${new Date().toLocaleString()}`);
      return { succes: false, code: 404, message: "Invalid Role In Query" };
    }
    const link = get_consent_url(role);
    console.log(`[SERVER]    Consent Link Generated : ${new Date().toLocaleString()}`);
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
          maxAge: 60 * 60 * 24,
          path: "/",
        });
        console.log(`[SERVER]   Set Tokens to Cookies : ${new Date().toLocaleString()}`);
      }
      console.log(`[SERVER]    Google Login Success : ${new Date().toLocaleString()}`);
      return response;
    },
    {
      query: GoogleCallbackSchema,
    }
  )

  // LOGOUT
  .get("/logout", async ({ cookie, set }) => {
    const existing_token = cookie["refresh_token"].value;
    const access_token = cookie["access_token"].value;
    if (!existing_token && !access_token) {
      set.status = 404;
      console.log(`[SERVER]   Already Logged Out : ${new Date().toLocaleString()}`);
      return {
        success: true,
        message: "Already Logged Out",
      };
    }
    cookie["refresh_token"].remove();
    cookie["access_token"].remove();
    set.status = 200;
    console.log(`[SERVER]   Logged Out : ${new Date().toLocaleString()}`);
    return {
      success: true,
      message: "Logged Out Successfully",
    };
  })

export default auth_routes;
