import { eq } from "drizzle-orm";
import db from "../../config/db";
import { user_model } from "../../models/shared/user.model";
import { RoleType } from "../../types/auth.types";
import {
  compare_password,
  create_unique_id,
  generate_jwt,
  generate_refresh_jwt,
  random_otp,
  verify_refresh_token,
} from "../../utils";
import { get_tokens, get_user_info } from "./google.service";
import { JwtPayload } from "jsonwebtoken";
import { otp_model } from "../../models/shared/otp.model";
import { find_user_by_email, find_user_by_value } from "./user.service";

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
const create_tokens = async (id: number, role: string) => {
  try {
    const new_access_token = generate_jwt(id, role);
    const new_refresh_token = generate_refresh_jwt(id, role);
    await db.update(user_model).set({ refresh_token: new_refresh_token }).where(eq(user_model.id,id));
    return {
      success: true,
      code: 200,
      message: "New Tokens Generated and Stored",
      data: {
        new_access_token,
        new_refresh_token,
      },
    };
  } catch (error) {
    return {
      success: false,
      code: 500,
      message: "ERROR: create_tokens",
    };
  }
};
const verify_token_with_db = async (refresh_token: string) => {
  try {
    const data = verify_refresh_token(refresh_token);
    if (!data.valid) {
      return {
        success: false,
        code: 404,
        message: "Invalid Refresh Token",
      };
    }
    if (
      !data.payload ||
      typeof data.payload === "string" ||
      typeof data.payload.id !== "number" ||
      typeof data.payload.role !== "string"
    ) {
      return {
        success: false,
        code: 400,
        message: "Invalid payload in refresh token",
      };
    }
    const res: { id: number; role: string } = {
      id: data.payload.id,
      role: data.payload.role,
    };

    const token_exists = (
      await db
        .select({ refresh_token: user_model.refresh_token })
        .from(user_model)
        .where(eq(user_model.id, res.id))
    )[0];

    if (refresh_token !== token_exists.refresh_token) {
      return {
        success: false,
        code: 404,
        message: "Refresh Token Expired",
      };
    }
    return {
      success: true,
      code: 200,
      message: "Refresh Token Matched",
      data: {
        id: data.payload.id,
        role: data.payload.role,
      },
    };
  } catch (error) {
    return {
      success: false,
      code: 500,
      message: "ERROR: verify_token_with_db",
    };
  }
};
const handle_google_callback = async ({ query, set }: any) => {
  try {
    if (!query.code || typeof query.code !== "string") {
      set.status = 400;
      return {
        success: false,
        code: 404,
        message: "Error: Invalid or missing code parameter.",
      };
    }

    const state = query.state;
    let role: string | undefined;
    try {
      role = JSON.parse(state)?.role;
    } catch {
      set.status = 400;
      return {
        success: false,
        code: 404,
        message: "Invalid state parameter",
      };
    }

    if (!role) {
      set.status = 400;
      return {
        success: false,
        code: 404,
        message: "Missing role in OAuth state",
      };
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
      return {
        success: false,
        code: 404,
        message: "Error: Incomplete user info from Google.",
      };
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
      const user_id = create_unique_id();
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
    return {
      success: true,
      code: 200,
      message: "Error during authentication.",
    };
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
const handle_login_by_otp = async (value: string | number) => {
  try {
    const user_exists = await find_user_by_value(value);
    if (!user_exists || !user_exists.data) {
      return user_exists;
    }
    const access_token = generate_jwt(user_exists.data.id, user_exists.data.role);
    const refresh_token = generate_refresh_jwt(user_exists.data.id, user_exists.data.role);

    await db.update(user_model).set({ refresh_token }).where(eq(user_model.id, user_exists.data.id));

    return {
      success: true,
      code: 200,
      message: "Login successful",
      data: {
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

export const generate_otp = async (value: string | number, is_signup: string) => {
  const isPhone = typeof value === "number";
  const field = isPhone ? otp_model.phone : otp_model.email;
  const label = isPhone ? "Phone" : "Email";
  const now = new Date().toLocaleString();

  try {
    // Check if user exists with the given phone or email
    if (is_signup == "signup") {
      const user_exists = await db
        .select()
        .from(user_model)
        .where(eq(isPhone ? user_model.phone : user_model.email, value))
        .limit(1);

      if (user_exists.length) {
        return {
          success: false,
          code: 404,
          message: `User found with this ${label.toLowerCase()}: ${value}`,
        };
      }
    }
    const otp = random_otp();
    const existing = (
      await db.select().from(otp_model).where(eq(field, value)).limit(1)
    )[0];

    if (existing) {
      await db.update(otp_model).set({ otp }).where(eq(field, value));
      console.log(
        `[SERVER]    Updated OTP sent to ${label}: ${value} @ ${now}`
      );
    } else {
      const otp_id = create_unique_id();
      const insertData: any = {
        id: otp_id,
        otp,
      };
      insertData[isPhone ? "phone" : "email"] = value;

      await db.insert(otp_model).values(insertData);
      console.log(`[SERVER]    New OTP sent to ${label}: ${value} @ ${now}`);
    }

    return {
      success: true,
      code: 200,
      message: `OTP sent to ${label.toLowerCase()}: ${value}`,
    };
  } catch (error) {
    console.error(
      `[SERVER]    Failed to send OTP to ${label}: ${value} @ ${now}`
    );
    console.error(`[ERROR]`, error);
    return {
      success: false,
      code: 500,
      message: `Failed to send OTP to ${label.toLowerCase()}: ${value}`,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};
export {
  create_tokens,
  handle_login_by_token,
  handle_login,
  handle_google_callback,
  verify_token_with_db,
  handle_login_by_otp,
};
