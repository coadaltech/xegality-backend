import db from "../../config/db";
import { otp_model } from "../../models/shared/otp.model";
import { random_otp } from "../../utils";
import { eq } from "drizzle-orm";
import { find_user_by_phone } from "./user.service";

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
const verify_otp = async (otp: number, phone: number) => {
  try {
    const db_response = await db
      .select({ otp: otp_model.otp })
      .from(otp_model)
      .where(eq(otp_model.phone, phone));

    if (!db_response || db_response.length === 0) {
      return { success: false, code: 404, message: "OTP doesn't exist" };
    }

    if (otp === db_response[0].otp) {
      await db.delete(otp_model).where(eq(otp_model.phone, phone));
      return { success: true, code: 200, message: "OTP verified and deleted" };
    }

    return { success: false, code: 401, message: "Invalid OTP" };
  } catch (error) {
    console.error(error);
    return { success: false, code: 500, message: "ERROR : verify_otp" };
  }
};
//  1 DB Call
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

export { generate_otp, verify_otp, find_otp_by_phone };
