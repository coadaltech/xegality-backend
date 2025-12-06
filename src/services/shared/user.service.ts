import { eq } from "drizzle-orm";
import db from "../../config/db";
import { user_model } from "../../models/shared/user.model";
import { RoleType } from "../../types/user.types";
import {
  create_unique_id,
  generate_jwt,
  generate_refresh_jwt,
  hash_password,
} from "@/utils/general.utils";
import { consumer_profile_model } from "@/models/consumer/consumer.model";
import { lawyer_profile_model } from "@/models/lawyer/lawyer.model";
import { student_profile_model } from "@/models/student/student.model";

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
  try {
    let user_id;
    do {
      user_id = create_unique_id();
    } while ((await find_user_by_id(user_id)).success);

    const hashed_password = await hash_password(password);

    const access_token = generate_jwt(user_id, role, false);
    const refresh_token = generate_refresh_jwt(user_id, role);

    await db
      .insert(user_model)
      .values({
        id: user_id,
        name,
        role,
        phone,
        email,
        hashed_password,
        refresh_token,
      })
      .returning();

    return {
      success: true,
      code: 200,
      message: "User Created Successfully",
      data: {
        user_id,
        name,
        role,
        phone,
        refresh_token,
        access_token,
        email,
      },
    };
  } catch (error: any) {
    if (error?.cause?.code === "23505") {
      const detail = error?.cause?.detail as string;

      if (detail.includes("phone")) {
        return {
          success: false,
          code: 409,
          message: "Phone number already exists",
        };
      } else if (detail.includes("email")) {
        return {
          success: false,
          code: 409,
          message: "Email already exists",
        };
      }
    }

    return {
      success: false,
      code: 500,
      message: "Internal Server Error",
    };
  }
};

export const get_user_details = async (id: number, role: RoleType) => {
  try {
    let db_result;

    if (role === "consumer") {
      db_result = await db
        .select({
          id: user_model.id,
          role: user_model.role,
          name: user_model.name,
          phone: user_model.phone,
          email: user_model.email,
          is_profile_complete: user_model.is_profile_complete,
          profile_pic: consumer_profile_model.profile_picture,
        })
        .from(user_model)
        .leftJoin(
          consumer_profile_model,
          eq(user_model.id, consumer_profile_model.id)
        )
        .where(eq(user_model.id, id))
        .limit(1);
    } else if (role === "lawyer") {
      db_result = await db
        .select({
          id: user_model.id,
          role: user_model.role,
          name: user_model.name,
          phone: user_model.phone,
          email: user_model.email,
          is_profile_complete: user_model.is_profile_complete,
          profile_pic: lawyer_profile_model.profile_picture,
        })
        .from(user_model)
        .leftJoin(
          lawyer_profile_model,
          eq(user_model.id, lawyer_profile_model.id)
        )
        .where(eq(user_model.id, id))
        .limit(1);
    } else if (role === "student") {
      db_result = await db
        .select({
          id: user_model.id,
          role: user_model.role,
          name: user_model.name,
          phone: user_model.phone,
          email: user_model.email,
          is_profile_complete: user_model.is_profile_complete,
          profile_pic: student_profile_model.profile_picture,
        })
        .from(user_model)
        .leftJoin(
          student_profile_model,
          eq(user_model.id, student_profile_model.id)
        )
        .where(eq(user_model.id, id))
        .limit(1);
    } else {
      db_result = await db
        .select({
          id: user_model.id,
          role: user_model.role,
          name: user_model.name,
          phone: user_model.phone,
          email: user_model.email,
          is_profile_complete: user_model.is_profile_complete,
        })
        .from(user_model)
        .where(eq(user_model.id, id))
        .limit(1);
    }

    if (db_result.length === 0) {
      return {
        success: false,
        code: 404,
        message: "User not found",
      };
    }

    return {
      success: true,
      code: 200,
      message: "User details fetched successfully",
      data: db_result[0],
    };
  } catch (error) {
    return {
      success: false,
      code: 500,
      message: "ERROR get_user_details",
    };
  }
};
