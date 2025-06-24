import { eq } from "drizzle-orm";
import db from "../../config/db";
import { user_model } from "../../models/shared/user.model";
import { RoleType } from "../../types/auth.types";
import {
  create_unique_id,
  generate_jwt,
  generate_refresh_jwt,
  hash_password,
} from "../../utils";
import { consumer_model } from "../../models/consumer.model";
import { student_model } from "../../models/student.model";
import { lawyer_model } from "../../models/lawyer.model";

export const find_user_by_id = async (id: number) => {
  try {
    const existing_user = (
      await db.select().from(user_model).where(eq(user_model.id, id)).limit(1)
    )[0];
    if (!existing_user) {
      return { success: false, code: 404, message: "No Such User" };
    }
    return {
      success: true,
      code: 200,
      message: "User Exists",
      data: existing_user,
    };
  } catch (error) {
    return { success: false, code: 500, message: "ERROR : find_user_by_id" };
  }
};
export const find_user_by_email = async (email: string) => {
  try {
    const existing_user = (
      await db
        .select()
        .from(user_model)
        .where(eq(user_model.email, email))
        .limit(1)
    )[0];
    if (!existing_user) {
      return { success: false, code: 404, message: "No Such User" };
    }
    return {
      success: true,
      code: 200,
      message: "User Exists",
      data: existing_user,
    };
  } catch (error) {
    return { success: false, code: 500, message: "ERROR : find_user_by_email" };
  }
};
export const find_user_by_value = async (value: string | number) => {
  try {
    let user_exists;
    if (typeof value === "number") {
      // Phone-based OTP
      user_exists = await db
        .select()
        .from(user_model)
        .where(eq(user_model.phone, value));
    } else {
      // Email-based OTP
      user_exists = await db
        .select()
        .from(user_model)
        .where(eq(user_model.email, value));
    }

    if (!user_exists || user_exists.length === 0) {
      return { success: false, code: 404, message: "OTP doesn't exist" };
    }
    return {
      success: true,
      code: 200,
      message: "User Exists",
      data: user_exists[0],
    };
  } catch (error) {
    return { success: false, code: 500, message: "ERROR : find_user_by_email" };
  }
};

export const create_user = async (
  name: string,
  password: string,
  role: RoleType,
  phone?: number,
  email?: string
) => {
  const now = new Date().toLocaleString();

  try {
    // Generate unique user ID
    let user_id;
    do {
      user_id = create_unique_id();
    } while ((await find_user_by_id(user_id)).success);

    // Hash password
    const hashed_password = await hash_password(password);

    // Generate tokens
    const access_token = generate_jwt(user_id, role);
    const refresh_token = generate_refresh_jwt(user_id, role);

    // Insert user
    await db.insert(user_model).values({
      id: user_id,
      name,
      role,
      phone,
      email,
      hashed_password,
      refresh_token,
    });

    console.log(
      `[SERVER]    User inserted into user_model: ${user_id} @ ${now}`
    );

    // Insert role-specific profile
    const role_model =
      role === "consumer"
        ? consumer_model
        : role === "student"
          ? student_model
          : lawyer_model;

    await db.insert(role_model).values({
      id: user_id,
    });

    console.log(
      `[SERVER]    Role model inserted for ${role}: ${user_id} @ ${now}`
    );

    return {
      success: true,
      code: 200,
      message: "User Created Successfully",
      data: {
        refresh_token,
        access_token,
      },
    };
  } catch (error: any) {
    const detail = error?.cause?.detail;
    const code = error?.cause?.code;

    if (code === "23505") {
      if (detail?.includes("phone")) {
        console.warn(
          `[SERVER]    Duplicate phone found during signup @ ${now}`
        );
        return {
          success: false,
          code: 409,
          message: "Phone number already exists",
        };
      }
      if (detail?.includes("email")) {
        console.warn(
          `[SERVER]    Duplicate email found during signup @ ${now}`
        );
        return {
          success: false,
          code: 409,
          message: "Email already exists",
        };
      }
    }

    console.error(`[SERVER]    Error creating user @ ${now}`);
    console.error(`[ERROR]`, error);

    return {
      success: false,
      code: 500,
      message: "Internal Server Error",
      error: error instanceof Error ? error.message : String(error),
    };
  }
};
