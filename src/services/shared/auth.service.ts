import { eq } from "drizzle-orm";
import db from "../../config/db";
import { user_model } from "../../models/shared/user.model";
import { RoleType } from "../../types/user.types";
import {
  compare_password,
  create_unique_id,
  generate_jwt,
  generate_refresh_jwt,
  random_otp,
  verify_refresh_token,
  hash_password,
} from "@/utils/general.utils";
import { get_tokens, get_user_info } from "./google.service";
import { JwtPayload } from "jsonwebtoken";
import { otp_model } from "../../models/shared/otp.model";
import { sendSMS, generateOTPSmsMessage } from "./sms.service";
import { sendOTP as sendEmailOTP } from "../nodemailer";

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

    const access_token = generate_jwt(
      user.id,
      user.role,
      user.is_profile_complete || false
    );
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

const create_tokens = async (
  id: number,
  role: string,
  is_profile_complete: boolean
) => {
  try {
    const new_access_token = generate_jwt(id, role, is_profile_complete);
    const new_refresh_token = generate_refresh_jwt(id, role);
    await db.update(user_model).set({ refresh_token: new_refresh_token });
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
        .select({
          refresh_token: user_model.refresh_token,
          is_profile_complete: user_model.is_profile_complete,
        })
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
        is_profile_complete: token_exists.is_profile_complete || false,
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
    let role: string;
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
      const access_token = generate_jwt(
        exisiting_user.id,
        role,
        exisiting_user.is_profile_complete || false
      );
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

    const user = await db
      .select()
      .from(user_model)
      .where(eq(user_model.id, id))
      .then((rows) => rows[0]);

    const access_token = generate_jwt(
      id,
      role,
      user.is_profile_complete || false
    );
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
        role: updated_user.role,
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
  console.log("otp", otp);

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
      const otp_id = create_unique_id();
      await db.insert(otp_model).values({
        id: otp_id,
        otp,
        phone: value,
      });
    }

    // Send SMS with OTP
    // const message = generateOTPSmsMessage(otp);
    // const smsResponse = await sendSMS({
    //   number: value.toString(),
    //   message,
    // });

    // if (!smsResponse.success) {
    //   console.error("[SMS Service] Failed to send OTP SMS:", smsResponse.error);
    //   return {
    //     success: false,
    //     code: 500,
    //     message: `Failed to send OTP via SMS: ${smsResponse.error}`,
    //   };
    // }

    return {
      success: true,
      code: 200,
      message: `OTP sent to phone: ${value}`,
    };
  } else {
    // Handle email login
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
      const otp_id = create_unique_id();
      await db.insert(otp_model).values({
        id: otp_id,
        otp,
        email: value,
      });
    }

    // Send email with OTP
    const emailResponse = await sendEmailOTP(value.toString(), otp.toString());

    console.log("email response", emailResponse);

    if (!emailResponse || !emailResponse.success) {
      console.error("[Email Service] Failed to send OTP email");
      return {
        success: false,
        code: 500,
        message: "Failed to send OTP via email",
      };
    }

    return {
      success: true,
      code: 200,
      message: `OTP sent to email: ${value}`,
    };
  }
};

const change_password = async (
  userId: number,
  currentPassword: string,
  newPassword: string
) => {
  try {
    // Get user with current password
    const user = await db
      .select({
        id: user_model.id,
        hashed_password: user_model.hashed_password,
        isdeleted: user_model.isdeleted,
      })
      .from(user_model)
      .where(eq(user_model.id, userId))
      .then((rows) => rows[0]);

    if (!user) {
      return {
        success: false,
        code: 404,
        message: "User not found",
      };
    }

    if (user.isdeleted) {
      return {
        success: false,
        code: 403,
        message: "Account has been deleted",
      };
    }

    if (!user.hashed_password) {
      return {
        success: false,
        code: 400,
        message: "Account does not have a password set",
      };
    }

    // Verify current password
    const isCurrentPasswordCorrect = await compare_password(
      currentPassword,
      user.hashed_password
    );

    if (!isCurrentPasswordCorrect) {
      return {
        success: false,
        code: 401,
        message: "Current password is incorrect",
      };
    }

    // Hash new password
    const hashedNewPassword = await hash_password(newPassword);

    // Update password and clear refresh token
    await db
      .update(user_model)
      .set({
        hashed_password: hashedNewPassword,
        refresh_token: "",
      })
      .where(eq(user_model.id, userId));

    return {
      success: true,
      code: 200,
      message: "Password changed successfully",
    };
  } catch (error: any) {
    console.error("Change password error:", error);
    return {
      success: false,
      code: 500,
      message: "Internal server error while changing password",
    };
  }
};

const soft_delete_account = async (userId: number, password: string) => {
  try {
    // Get user with current password
    const user = await db
      .select({
        id: user_model.id,
        hashed_password: user_model.hashed_password,
        isdeleted: user_model.isdeleted,
      })
      .from(user_model)
      .where(eq(user_model.id, userId))
      .then((rows) => rows[0]);

    if (!user) {
      return {
        success: false,
        code: 404,
        message: "User not found",
      };
    }

    if (user.isdeleted) {
      return {
        success: false,
        code: 403,
        message: "Account has already been deleted",
      };
    }

    if (!user.hashed_password) {
      return {
        success: false,
        code: 400,
        message: "Account does not have a password set",
      };
    }

    // Verify password
    const isPasswordCorrect = await compare_password(
      password,
      user.hashed_password
    );

    if (!isPasswordCorrect) {
      return {
        success: false,
        code: 401,
        message: "Password is incorrect",
      };
    }

    // Soft delete by setting isDeleted to true
    await db
      .update(user_model)
      .set({ isdeleted: true })
      .where(eq(user_model.id, userId));

    return {
      success: true,
      code: 200,
      message: "Account deleted successfully",
    };
  } catch (error: any) {
    console.error("Soft delete account error:", error);
    return {
      success: false,
      code: 500,
      message: "Internal server error while deleting account",
    };
  }
};

export {
  create_tokens,
  handle_login_by_token,
  handle_login,
  otp_cycle,
  handle_google_callback,
  verify_token_with_db,
  change_password,
  soft_delete_account,
};
