import { eq } from "drizzle-orm";
import db from "../../config/db";
import { user_model } from "../../models/shared/user.model";
import { RoleType } from "../../types/auth.types";
import {
  compare_password,
  generate_jwt,
  generate_refresh_jwt,
  hash_password,
  random_otp,
} from "../../utils";
import { redirect, t } from "elysia";
import { get_tokens, get_user_info } from "./google.service";
import { JwtPayload } from "jsonwebtoken";
import { otp_model } from "../../models/shared/otp.model";
import { find_otp_by_email, find_otp_by_phone } from "./otp.service";

//  1 DB Call
const find_user_by_email = async (email: string) => {
  try {
    const exisiting_user = (
      await db
        .select()
        .from(user_model)
        .where(eq(user_model.email, email))
        .limit(1)
    )[0];
    if (!exisiting_user) {
      return { success: false, code: 404, message: "No Such User" };
    }
    return {
      success: true,
      code: 200,
      message: "User Exists",
      data: exisiting_user,
    };
  } catch (error) {
    return {
      success: false,
      code: 500,
      message: "Error in finding user by email",
    };
  }
};
//  1 DB Call
const find_user_by_phone = async (phone: number) => {
  try {
    const exisiting_user = (
      await db
        .select()
        .from(user_model)
        .where(eq(user_model.phone, phone))
        .limit(1)
    )[0];
    if (!exisiting_user) {
      return { success: false, code: 404, message: "No Such User" };
    }
    return {
      success: true,
      code: 200,
      message: "User Exists",
      data: exisiting_user,
    };
  } catch (error) {
    return {
      success: false,
      code: 500,
      message: "Error in finding user by phone",
    };
  }
};

//  2 DB Call
const handle_login = async (password: string, value: number | string) => {
  try {
    const whereCondition =
      typeof value === "number"
        ? eq(user_model.phone, value)
        : eq(user_model.email, value);

    const user = await db
      .select()
      .from(user_model)
      .where(whereCondition)
      .then((res) => res[0]);

    if (!user) {
      return {
        success: false,
        code: 404,
        message: "User not found",
      };
    }

    if (!user.hashed_password) {
      return {
        success: false,
        code: 403,
        message: "Account is not password protected",
        help: {
          message: "Login via OTP!",
          link: `${process.env.FRONTEND_URL}/otp-login`,
        },
      };
    }

    const isPasswordCorrect = await compare_password(
      password,
      user.hashed_password
    );
    if (!isPasswordCorrect) {
      return {
        success: false,
        code: 401,
        message: "Incorrect password",
      };
    }

    const access_token = generate_jwt(user.id, user.role);
    const refresh_token = generate_refresh_jwt(user.id, user.role);

    await db.update(user_model).set({ refresh_token }).where(whereCondition);

    return {
      success: true,
      code: 200,
      message: "Login successful",
      data: {
        id: user.id,
        name: user.name,
        role: user.role,
        phone: user.phone,
        email: user.email,
        refresh_token,
        access_token,
      },
    };
  } catch (error: any) {
    console.error("Login error:", error);
    return {
      success: false,
      code: 500,
      message: "Internal server error during login",
    };
  }
};

const handle_google_callback = async ({ query, set }: any) => {
  try {
    if (!query.code || typeof query.code !== "string") {
      set.status = 400;
      return "Error: Invalid or missing code parameter.";
    }

    const state = query.state;
    let role: string | undefined;
    try {
      role = JSON.parse(state)?.role;
    } catch {
      set.status = 400;
      return "Invalid state parameter";
    }

    if (!role) {
      set.status = 400;
      return "Missing role in OAuth state";
    }

    const { id_token } = await get_tokens(query.code);
    if (!id_token) {
      return {
        success: false,
        code: 404,
        message: "Error: No Such Token ID",
      };
    }
    const data = await get_user_info(id_token);
    if (!data || !data.email || !data.name) {
      set.status = 500;
      return "Error: Incomplete user info from Google.";
    }

    const exisiting_user = (
      await db
        .select()
        .from(user_model)
        .where(eq(user_model.email, data.email))
        .limit(1)
    )[0];

    // Login
    if (exisiting_user) {
      const refresh_token = generate_refresh_jwt(exisiting_user.id, role);
      const access_token = generate_jwt(exisiting_user.id, role);
      await db
        .update(user_model)
        .set({
          refresh_token: refresh_token,
        })
        .where(eq(user_model.email, data.email));
      return {
        success: true,
        code: 200,
        message: "Login successful",
        data: {
          id: exisiting_user.id,
          name: exisiting_user.name,
          refresh_token,
          access_token,
        },
        redirect: `${process.env.FRONTEND_URL}/${role}/dashboard`,
      };
    } else {
      // Signup
      const user_id = `user_${Date.now()}${Math.random()
        .toString(36)
        .slice(2, 6)}`;
      const refresh_token = generate_refresh_jwt(user_id, role);
      const access_token = generate_jwt(user_id, role);
      await db.insert(user_model).values({
        id: user_id,
        name: data.name,
        role: role as RoleType,
        email: data.email,
        refresh_token: refresh_token,
        profile_pic: data.profile_pic,
      });
      return {
        success: true,
        code: 200,
        message: "Login successful",
        data: {
          id: user_id,
          name: data.name,
          refresh_token,
          access_token,
        },
        redirect: `${process.env.FRONTEND_URL}/${role}`,
      };
    }
  } catch (error) {
    console.error("[SERVER.AUTH] Error in Google callback:", error);
    set.status = 500;
    return "Error during authentication.";
  }
};
const handle_login_by_token = async (payload: JwtPayload) => {
  try {
    const { id, role } = payload;

    const access_token = generate_jwt(id, role);
    const refresh_token = generate_refresh_jwt(id, role);

    const updated_user = await db
      .update(user_model)
      .set({ refresh_token })
      .where(eq(user_model.id, id))
      .returning({
        id: user_model.id,
        name: user_model.name,
        role: user_model.role,
      })
      .then((rows) => rows[0]);

    if (!updated_user) {
      return {
        success: false,
        code: 404,
        message: "User not found",
      };
    }

    return {
      success: true,
      code: 200,
      message: "Logged in via refresh token",
      data: {
        id: updated_user.id,
        name: updated_user.name,
        access_token,
        refresh_token,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      code: 500,
      message: "Error logging in with token",
      error: error?.message,
    };
  }
};

const otp_cycle = async (value: string | number) => {
  const otp = random_otp();

  if (typeof value === "number") {
    // Handle phone login
    const existing = (
      await db
        .select()
        .from(otp_model)
        .where(eq(otp_model.phone, value))
        .limit(1)
    )[0];

    if (existing) {
      await db.update(otp_model).set({ otp }).where(eq(otp_model.phone, value));
    } else {
      await db.insert(otp_model).values({
        otp,
        phone: value,
      });
    }
    return {
      success: true,
      code: 200,
      message: `OTP sent to phone: ${value}`,
    };
  } else {
    // Handle phone login
    const existing = (
      await db
        .select()
        .from(otp_model)
        .where(eq(otp_model.email, value))
        .limit(1)
    )[0];

    if (existing) {
      await db.update(otp_model).set({ otp }).where(eq(otp_model.email, value));
    } else {
      await db.insert(otp_model).values({
        otp,
        email: value,
      });
    }
    return {
      success: true,
      code: 200,
      message: `OTP sent to email: ${value}`,
    };
  }
};
const querySchema = t.Object({
  code: t.String(),
});

export {
  handle_login_by_token,
  find_user_by_email,
  find_user_by_phone,
  handle_login,
  otp_cycle,
  handle_google_callback,
  querySchema,
};
