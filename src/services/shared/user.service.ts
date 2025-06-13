import { eq } from "drizzle-orm";
import db from "../../config/db";
import { user_model } from "../../models/shared/user.model";
import { RoleType } from "../../types/auth.types";
import {
  compare_password,
  generate_jwt,
  generate_refresh_jwt,
  hash_password,
} from "../../utils";
import { redirect, t } from "elysia";
import { get_tokens, get_user_info } from "./google.service";

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
//  1 DB Call
const handle_signup = async (
  name: string,
  password: string,
  phone: number,
  role: RoleType,
  email?: string
) => {
  try {
    const hashed_password = await hash_password(password);
    const access_token = generate_jwt(phone, role);
    const refresh_token = generate_refresh_jwt(phone, role);

    await db
      .insert(user_model)
      .values({
        name,
        role,
        phone,
        refresh_token,
        email,
        hashed_password,
      })
      .returning();
    return {
      success: true,
      code: 200,
      message: "User Created Successfully",
      data: {
        name,
        role,
        phone,
        refresh_token,
        access_token,
        email,
        hashed_password,
      },
    };
  } catch (error: any) {
    if (error?.cause?.code === "23505") {
      return {
        success: false,
        code: 409,
        message: "Phone number already exists",
      };
    }

    return {
      success: false,
      code: 500,
      message: "Error in handling signup",
    };
  }
};
//  2 DB Call
const handle_login = async (
  password: string,
  phone?: number,
  email?: string
) => {
  try {
    if (!email && !phone) {
      return {
        success: false,
        code: 404,
        message: "Login with either email or phone",
      };
    }

    const whereCondition = phone
      ? eq(user_model.phone, phone)
      : eq(user_model.email, email!);

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
        code: 404,
        message: "Account is not password protected",
      };
    }
    const isPasswordCorrect = await compare_password(
      password,
      user.hashed_password!
    );
    if (!isPasswordCorrect) {
      return {
        success: false,
        code: 401,
        message: "Incorrect password",
      };
    }

    const access_token = generate_jwt(user.phone!, user.role);
    const refresh_token = generate_refresh_jwt(user.phone!, user.role);

    await db.update(user_model).set({ refresh_token }).where(whereCondition);

    return {
      success: true,
      code: 200,
      message: "Login successful",
      data: {
        name: user.name,
        role: user.role,
        phone: user.phone,
        refresh_token: refresh_token,
        access_token: access_token,
        email: user.email,
      },
    };
  } catch (error: any) {
    console.log("Login error:", error);
    return {
      success: false,
      code: 500,
      message: "Error in handling login",
    };
  }
};
const existing_user = async (phone?: number, email?: string) => {};
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

    const { id_token, access_token } = await get_tokens(query.code);
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
      await db.update(user_model).set({
        refresh_token: id_token,
      });
      return Response.redirect(
        `${process.env.FRONTEND_URL}/${role}/dashboard`,
        302
      );
    } else {
      // Signup
      await db.insert(user_model).values({
        name: data.name,
        role: role as RoleType,
        email: data.email,
        refresh_token: id_token,
        profile_pic: data.profile_pic,
      });
      return Response.redirect(`${process.env.FRONTEND_URL}/${role}`, 302);
    }
  } catch (error) {
    console.error("[SERVER.AUTH] Error in Google callback:", error);
    set.status = 500;
    return "Error during authentication.";
  }
};

// Use this query validator with Elysia
const querySchema = t.Object({
  code: t.String(),
});

export {
  find_user_by_email,
  find_user_by_phone,
  handle_signup,
  handle_login,
  handle_google_callback,
  querySchema,
};
