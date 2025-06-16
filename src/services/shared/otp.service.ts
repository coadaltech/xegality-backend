import db from "../../config/db";
import { otp_model } from "../../models/shared/otp.model";
import {
  generate_jwt,
  generate_refresh_jwt,
  hash_password,
  random_otp,
} from "../../utils";
import { eq } from "drizzle-orm";
import { find_user_by_phone } from "./user.service";
import { RoleType } from "../../types/auth.types";
import { user_model } from "../../models/shared/user.model";

//  3 DB Call
const generate_otp = async (phone: number) => {
  try {
    const user_result = await find_user_by_phone(phone);
    if (user_result.data) {
      return user_result;
    }
    const otp = random_otp();

    const otp_result = await find_otp_by_phone(phone);
    if (otp_result.code == 200 && otp_result.success) {
      await db.update(otp_model).set({ otp });
    } else {
      await db.insert(otp_model).values({
        otp: otp,
        phone: phone,
      });
    }
    return {
      success: true,
      code: 200,
      message: "OTP Generated Successfully",
      otp,
    };
  } catch (error) {
    return {
      success: false,
      code: 500,
      message: "ERROR : generate_otp",
    };
  }
};
//  2 DB Call

const create_user = async (
  name: string,
  password: string,
  role: RoleType,
  phone?: number,
  email?: string
) => {
  try {
    const user_id = `user_${Date.now()}${Math.random()
      .toString(36)
      .slice(2, 6)}`;
    const hashed_password = await hash_password(password);
    const access_token = generate_jwt(user_id, role);
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
        hashed_password,
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

      return {
        success: false,
        code: 500,
        message: "Internal Server Error",
      };
    }
  }
};
const verify_otp = async (otp: number, value: string | number) => {
  try {
    let db_response;

    if (typeof value === "number") {
      // Phone-based OTP
      db_response = await db
        .select({ otp: otp_model.otp })
        .from(otp_model)
        .where(eq(otp_model.phone, value));
    } else {
      // Email-based OTP
      db_response = await db
        .select({ otp: otp_model.otp })
        .from(otp_model)
        .where(eq(otp_model.email, value));
    }

    if (!db_response || db_response.length === 0) {
      return { success: false, code: 404, message: "OTP doesn't exist" };
    }

    if (otp === db_response[0].otp) {
      // OTP is correct; delete it
      if (typeof value === "number") {
        await db.delete(otp_model).where(eq(otp_model.phone, value));
      } else {
        await db.delete(otp_model).where(eq(otp_model.email, value));
      }

      return {
        success: true,
        code: 200,
        message: "OTP verified and deleted",
      };
    }

    return { success: false, code: 401, message: "Invalid OTP" };
  } catch (error) {
    console.error(error);
    return { success: false, code: 500, message: "ERROR : verify_otp" };
  }
}; //  1 DB Call
const find_otp_by_phone = async (phone: number) => {
  try {
    const exisiting_otp = (
      await db
        .select()
        .from(otp_model)
        .where(eq(otp_model.phone, phone))
        .limit(1)
    )[0];
    if (!exisiting_otp) {
      return { success: false, code: 404, message: "No Such OTP" };
    }
    return {
      success: true,
      code: 200,
      message: "OTP Exists",
      data: exisiting_otp,
    };
  } catch (error) {
    return { success: false, code: 500, message: "ERROR : find_otp_by_otp" };
  }
};
const find_otp_by_email = async (email: string) => {
  try {
    const exisiting_otp = (
      await db
        .select()
        .from(otp_model)
        .where(eq(otp_model.email, email))
        .limit(1)
    )[0];
    if (!exisiting_otp) {
      return { success: false, code: 404, message: "No Such OTP" };
    }
    return {
      success: true,
      code: 200,
      message: "OTP Exists",
      data: exisiting_otp,
    };
  } catch (error) {
    return { success: false, code: 500, message: "ERROR : find_otp_by_otp" };
  }
};
export {
  generate_otp,
  verify_otp,
  find_otp_by_phone,
  find_otp_by_email,
  create_user,
};
