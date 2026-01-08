import db from "../../config/db";
import { otp_model } from "../../models/shared/otp.model";
import { eq } from "drizzle-orm";

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

const verify_otp = async (otp: number, value: string | number) => {
  try {
    const whereCondition =
      typeof value === "number"
        ? eq(otp_model.phone, value)
        : eq(otp_model.email, value);

    const db_response = await db
      .select({ otp: otp_model.otp, created_at: otp_model.created_at })
      .from(otp_model)
      .where(whereCondition)
      .limit(1);

    if (!db_response || db_response.length === 0) {
      return { success: false, code: 404, message: "OTP doesn't exist" };
    }

    const record = db_response[0];
    const createdAt = record.created_at
      ? new Date(record.created_at)
      : undefined;
    const isExpired =
      !createdAt || Date.now() - createdAt.getTime() > OTP_EXPIRY_MS;

    if (isExpired) {
      await db.delete(otp_model).where(whereCondition);
      return {
        success: false,
        code: 410,
        message: "OTP expired. Please request a new code.",
      };
    }

    if (otp !== record.otp) {
      return { success: false, code: 401, message: "Invalid OTP" };
    }

    await db.delete(otp_model).where(whereCondition);

    return {
      success: true,
      code: 200,
      message: "OTP verified and deleted",
    };
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
export { verify_otp, find_otp_by_phone, find_otp_by_email, OTP_EXPIRY_MS };
