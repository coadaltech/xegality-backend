import db from "../../config/db";
import { otp_model } from "../../models/shared/otp.model";
import { eq } from "drizzle-orm";

const verify_otp = async (otp: number, value: string | number) => {
  try {
    // Allow static OTP 1234 for testing
    // if (otp === 1234) {
    //   // Delete any existing OTP for this user
    //   if (typeof value === "number") {
    //     await db.delete(otp_model).where(eq(otp_model.phone, value));
    //   } else {
    //     await db.delete(otp_model).where(eq(otp_model.email, value));
    //   }

    //   return {
    //     success: true,
    //     code: 200,
    //     message: "OTP verified and deleted",
    //   };
    // }

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
};

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
export { verify_otp, find_otp_by_phone, find_otp_by_email };
