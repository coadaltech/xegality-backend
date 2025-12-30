import { Elysia, t } from "elysia";
import {
  otp_cycle,
  verify_token_with_db,
  create_tokens,
  handle_login_by_token,
  handle_login,
  handle_google_callback,
} from "../../services/shared/auth.service";
import { get_consent_url } from "../../services/shared/google.service";
import { verify_otp } from "../../services/shared/otp.service";
import { create_user } from "../../services/shared/user.service";
import {
  GenerateOtpSchema,
  VerifyUserSchema,
  LoginSchema,
  VerifyLoginOtpSchema,
  GoogleCallbackSchema,
} from "../../types/auth.types";
import { verify_access_token } from "@/utils/general.utils";
import { set_auth_cookies, clear_auth_cookies } from "@/utils/cookie.utils";
import { generate_jwt, generate_refresh_jwt } from "@/utils/general.utils";
import { eq } from "drizzle-orm";
import db from "../../config/db";
import { user_model } from "../../models/shared/user.model";
import { SubscriptionService } from "../../services/shared/subscription.service";

const auth_routes = new Elysia({ prefix: "/auth" })
  // SIGNUP
  .post(
    "/generate-otp",
    async ({ body, set }) => {
      const { phone, email } = body;
      if (!phone && !email) {
        set.status = 400;
        console.log(
          `[SERVER]   Phone or Email Missing : ${new Date().toLocaleString()}`
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
        set_auth_cookies(
          cookie,
          create_user_res.data.access_token,
          create_user_res.data.refresh_token
        );
        console.log(
          `[SERVER]   Set Tokens to Cookies : ${new Date().toLocaleString()}`
        );
      }

      console.log(
        `[SERVER]   User Created Success : ${new Date().toLocaleString()}`
      );
      return create_user_res;
    },
    { body: VerifyUserSchema }
  )

  // REFRESH TOKENS
  .get("/refresh-tokens", async ({ cookie, set }) => {
    const refresh_token = cookie.refresh_token;
    if (!refresh_token) {
      console.log(
        `[SERVER]   No Refresh Token Found : ${new Date().toLocaleString()}`
      );
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
      console.log(
        `[SERVER]   Invalid Refresh Token : ${new Date().toLocaleString()}`
      );
      return validation_response;
    }
    const data = await create_tokens(
      validation_response.data?.id!,
      validation_response.data?.role!,
      validation_response.data?.is_profile_complete!
    );
    if (!data?.success) {
      set.status = data?.code;
      console.log(
        `[SERVER]   Token Creation Failed : ${new Date().toLocaleString()}`
      );
      return data;
    }
    set.status = data.code;
    if (
      data.success &&
      data.data?.new_access_token &&
      data.data?.new_refresh_token
    ) {
      set_auth_cookies(
        cookie,
        data.data.new_access_token,
        data.data.new_refresh_token
      );
      console.log(
        `[SERVER]   Set Tokens to Cookies : ${new Date().toLocaleString()}`
      );
    }
    set.status = data.code;
    console.log(
      `[SERVER]   Token Creation Success : ${new Date().toLocaleString()}`
    );
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
        console.log(
          `[SERVER]   Phone or Email Missing : ${new Date().toLocaleString()}`
        );
        return {
          success: false,
          code: 404,
          message: "Either phone or email must be provided.",
        };
      }
      const value = body.phone ?? body.email;
      if (!value) {
        console.log(
          `[SERVER]   Invalid Email or : ${new Date().toLocaleString()}`
        );
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
        set_auth_cookies(
          cookie,
          response.data.access_token,
          response.data.refresh_token
        );
        console.log(
          `[SERVER]   Set Tokens to Cookies : ${new Date().toLocaleString()}`
        );
      }
      set.status = response?.code;
      return response;
    },
    { body: LoginSchema }
  )

  .post(
    "/verify-login-otp",
    async ({ body, set, cookie }) => {
      const { phone, email } = body;
      if (!phone && !email) {
        set.status = 400;
        console.log(
          `[SERVER]   Email or Phone Missing : ${new Date().toLocaleString()}`
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
          `[SERVER]   Invalid Email or Phone : ${new Date().toLocaleString()}`
        );
        return {
          success: false,
          message: "Value is neither Phone nor Email",
        };
      }

      const otpResponse = await verify_otp(body.otp, value);
      if (otpResponse.success == false) {
        set.status = otpResponse.code;
        console.log(
          `[SERVER]   OTP is Invalid : ${new Date().toLocaleString()}`
        );
        return otpResponse;
      }

      // OTP is valid, now authenticate user and return tokens
      const user = await db
        .select()
        .from(user_model)
        .where(
          typeof value === "number"
            ? eq(user_model.phone, value)
            : eq(user_model.email, value)
        )
        .then((res) => res[0]);

      if (!user) {
        set.status = 404;
        return {
          success: false,
          code: 404,
          message: "User not found",
        };
      }

      // Calculate subscription access
      const subscriptionAccess =
        await SubscriptionService.calculateSubscriptionAccess(
          user.id,
          user.created_at
        );

      const access_token = generate_jwt(
        user.id,
        user.role,
        user.is_profile_complete || false,
        subscriptionAccess.hasAccess,
        subscriptionAccess.expiresAt
      );
      const refresh_token = generate_refresh_jwt(user.id, user.role);

      await db
        .update(user_model)
        .set({ refresh_token })
        .where(eq(user_model.id, user.id));

      // Set auth cookies like signup endpoint
      set_auth_cookies(cookie, access_token, refresh_token);
      console.log(
        `[SERVER]   Set Tokens to Cookies : ${new Date().toLocaleString()}`
      );

      set.status = 200;
      console.log(
        `[SERVER]   OTP Login Successful : ${new Date().toLocaleString()}`
      );
      return {
        success: true,
        code: 200,
        message: "Login successful via OTP",
        data: {
          id: user.id,
          name: user.name,
          role: user.role,
        },
      };
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
    if (
      role !== "consumer" &&
      role !== "lawyer" &&
      role !== "student" &&
      role === "paralegal"
    ) {
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
        // Set auth cookies like signup endpoint
        set_auth_cookies(
          cookie,
          response.data.access_token,
          response.data.refresh_token
        );

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

  // LOGOUT
  .get("/logout", async ({ cookie, set }) => {
    const existing_token = cookie["refresh_token"].value;
    const access_token = cookie["access_token"].value;
    if (!existing_token && !access_token) {
      set.status = 404;
      console.log(
        `[SERVER]   Already Logged Out : ${new Date().toLocaleString()}`
      );
      return {
        success: true,
        message: "Already Logged Out",
      };
    }
    clear_auth_cookies(cookie);
    set.status = 200;
    console.log(`[SERVER]   Logged Out : ${new Date().toLocaleString()}`);
    return {
      success: true,
      message: "Logged Out Successfully",
    };
  })

  .post(
    "/test-upload",
    async ({ body }) => {
      console.log(body.name);
      // console.log(body.variants)
      console.log(body.image.type);
      console.log(body.image.size);
    },
    {
      body: t.Object({
        name: t.String(),
        // t.String() become t.ArrayString()
        // variants: t.ArrayString(
        //   t.Object({
        //     price: t.Number({ minimum: 0 }),
        //     weight: t.Number({ minimum: 0 }),
        //   }),
        // ),
        image: t.File({ type: "image" }),
      }),
    }
  );

export default auth_routes;
