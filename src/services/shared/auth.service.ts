import { eq, and } from "drizzle-orm";
import db from "../../config/db";
import { user_model } from "../../models/shared/user.model";
import { RoleType } from "../../types/user.types";
import {
  compare_password,
  create_unique_id,
  generate_jwt,
  random_otp,
  verify_refresh_token,
  hash_password,
} from "@/utils/general.utils";
import { get_tokens, get_user_info } from "./google.service";
import { JwtPayload } from "jsonwebtoken";
import { otp_model } from "../../models/shared/otp.model";
import { sendSMS, generateOTPSmsMessage } from "./sms.service";
import { OTP_EXPIRY_MS } from "./otp.service";
import { sendOTP as sendEmailOTP } from "../nodemailer";
import { SubscriptionService } from "./subscription.service";
import { otp_ip_rate_limit_model } from "../../models/shared/otp-ip-rate-limit.model";

const MAX_DAILY_OTP_ATTEMPTS = 5;
const OTP_IP_BAN_THRESHOLD = 10;
const OTP_IP_BAN_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const OTP_IP_BAN_DURATION_MS = 24 * 60 * 60 * 1000; // 1 day

type RateLimitPurpose = "otp-login-request" | "login-password" | "login-otp-verify";

const check_ip_ban = async (ip?: string | null, purpose?: RateLimitPurpose) => {
  if (!ip || !purpose) return null;
  const now = new Date();
  const record = (
    await db
      .select()
      .from(otp_ip_rate_limit_model)
      .where(
        and(
          eq(otp_ip_rate_limit_model.ip, ip),
          eq(otp_ip_rate_limit_model.purpose, purpose)
        )
      )
      .limit(1)
  )[0];

  const bannedUntil =
    record?.banned_until && new Date(record.banned_until as any);
  if (bannedUntil && bannedUntil.getTime() > now.getTime()) {
    return {
      banned: true,
      banned_until: bannedUntil,
      reason:
        record?.reason ||
        "Exceeded request limit (20+ attempts within 5 minutes).",
    };
  }
  return null;
};

const record_failed_attempt = async (
  ip?: string | null,
  purpose?: RateLimitPurpose
) => {
  if (!purpose) return { banned: false };
  const safeIp = ip || "unknown";
  const now = new Date();
  const existing = (
    await db
      .select()
      .from(otp_ip_rate_limit_model)
      .where(
        and(
          eq(otp_ip_rate_limit_model.ip, safeIp),
          eq(otp_ip_rate_limit_model.purpose, purpose)
        )
      )
      .limit(1)
  )[0];

  const windowStart = existing?.window_start
    ? new Date(existing.window_start as any)
    : now;
  const inWindow = now.getTime() - windowStart.getTime() < OTP_IP_BAN_WINDOW_MS;
  const nextCount = inWindow ? (existing?.count ?? 0) + 1 : 1;

  if (nextCount >= OTP_IP_BAN_THRESHOLD) {
    const banUntilDate = new Date(now.getTime() + OTP_IP_BAN_DURATION_MS);
    if (existing) {
      await db
        .update(otp_ip_rate_limit_model)
        .set({
          count: nextCount,
          window_start: inWindow ? windowStart : now,
          last_attempt: now,
          banned_until: banUntilDate,
          reason: "Exceeded request limit (20+ attempts within 5 minutes).",
        })
        .where(
          and(
            eq(otp_ip_rate_limit_model.ip, safeIp),
            eq(otp_ip_rate_limit_model.purpose, purpose)
          )
        );
    } else {
      await db.insert(otp_ip_rate_limit_model).values({
        ip: safeIp,
        purpose,
        count: nextCount,
        window_start: now,
        last_attempt: now,
        banned_until: banUntilDate,
        reason: "Exceeded request limit (20+ attempts within 5 minutes).",
      });
    }
    return { banned: true, banned_until: banUntilDate };
  }

  if (existing) {
    await db
      .update(otp_ip_rate_limit_model)
      .set({
        count: nextCount,
        window_start: inWindow ? windowStart : now,
        last_attempt: now,
        banned_until: null,
        reason: null,
      })
      .where(
        and(
          eq(otp_ip_rate_limit_model.ip, safeIp),
          eq(otp_ip_rate_limit_model.purpose, purpose)
        )
      );
  } else {
    await db.insert(otp_ip_rate_limit_model).values({
      ip: safeIp,
      purpose,
      count: nextCount,
      window_start: now,
      last_attempt: now,
    });
  }

  return { banned: false };
};

const isSameDay = (date?: Date | string | null) => {
  if (!date) return false;
  const parsedDate = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  return (
    parsedDate.getFullYear() === now.getFullYear() &&
    parsedDate.getMonth() === now.getMonth() &&
    parsedDate.getDate() === now.getDate()
  );
};

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

    // Calculate subscription access
    const subscriptionAccess =
      await SubscriptionService.calculateSubscriptionAccess(
        user.id,
        user.created_at
      );

    const access_token = generate_jwt(
      {
        id: user.id,
        role: user.role,
        is_profile_complete: user.is_profile_complete || false,
        has_subscription_access: subscriptionAccess.hasAccess,
        subscription_expires_at: subscriptionAccess.expiresAt,
        token_type: "access",
      }
    );
    const refresh_token =
      generate_jwt(
        {
          id: user.id,
          role: user.role,
          is_profile_complete: user.is_profile_complete || false,
          has_subscription_access: subscriptionAccess.hasAccess,
          subscription_expires_at: subscriptionAccess.expiresAt,
          token_type: "refresh",
        }
      );

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
    // Get user to check created_at for subscription calculation
    const user = await db
      .select({ created_at: user_model.created_at })
      .from(user_model)
      .where(eq(user_model.id, id))
      .then((rows) => rows[0]);

    if (!user) {
      return {
        success: false,
        code: 404,
        message: "User not found",
      };
    }

    // Calculate subscription access
    const subscriptionAccess =
      await SubscriptionService.calculateSubscriptionAccess(
        id,
        user.created_at
      );

    const new_access_token = generate_jwt(
      {
        id,
        role,
        is_profile_complete,
        has_subscription_access: subscriptionAccess.hasAccess,
        subscription_expires_at: subscriptionAccess.expiresAt,
        token_type: "access",
      }
    );
    const new_refresh_token = generate_jwt(
      {
        id,
        role,
        is_profile_complete,
        has_subscription_access: subscriptionAccess.hasAccess,
        subscription_expires_at: subscriptionAccess.expiresAt,
        token_type: "refresh",
      }
    );

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
          created_at: user_model.created_at,
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

    // Calculate subscription access
    const subscriptionAccess =
      await SubscriptionService.calculateSubscriptionAccess(
        res.id,
        token_exists.created_at
      );

    return {
      success: true,
      code: 200,
      message: "Refresh Token Matched",
      data: {
        id: data.payload.id,
        role: data.payload.role,
        is_profile_complete: token_exists.is_profile_complete || false,
        subscription_access: subscriptionAccess.hasAccess,
        subscription_expires_at: subscriptionAccess.expiresAt,
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
      // Calculate subscription access
      const subscriptionAccess =
        await SubscriptionService.calculateSubscriptionAccess(
          exisiting_user.id,
          exisiting_user.created_at
        );

      const refresh_token = generate_jwt(
        {
          id: exisiting_user.id,
          role: role,
          is_profile_complete: exisiting_user.is_profile_complete || false,
          has_subscription_access: subscriptionAccess.hasAccess,
          subscription_expires_at: subscriptionAccess.expiresAt,
          token_type: "refresh",
        }
      );
      const access_token = generate_jwt(
        {
          id: exisiting_user.id,
          role: role,
          is_profile_complete: exisiting_user.is_profile_complete || false,
          has_subscription_access: subscriptionAccess.hasAccess,
          subscription_expires_at: subscriptionAccess.expiresAt,
          token_type: "access",
        }
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
      // Signup - new user gets 7-day free trial
      const user_id = create_unique_id();
      const now = new Date();
      const trialEndDate = new Date(now);
      trialEndDate.setDate(trialEndDate.getDate() + 7);

      const refresh_token = generate_jwt(
        {
          id: user_id,
          role: role,
          is_profile_complete: false,
          has_subscription_access: true,
          subscription_expires_at: trialEndDate,
          token_type: "refresh",
        }
      )
      const access_token = generate_jwt(
        {
          id: user_id,
          role: role,
          is_profile_complete: false,
          has_subscription_access: true,
          subscription_expires_at: trialEndDate,
          token_type: "access",
        }
      );

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

    if (!user) {
      return {
        success: false,
        code: 404,
        message: "User not found",
      };
    }

    // Calculate subscription access
    const subscriptionAccess =
      await SubscriptionService.calculateSubscriptionAccess(
        id,
        user.created_at
      );

    const access_token = generate_jwt(
      {
        id,
        role,
        is_profile_complete: user.is_profile_complete || false,
        has_subscription_access: subscriptionAccess.hasAccess,
        subscription_expires_at: subscriptionAccess.expiresAt,
        token_type: "access",
      }
    );
    const refresh_token = generate_jwt(
      {
        id,
        role,
        is_profile_complete: user.is_profile_complete || false,
        has_subscription_access: subscriptionAccess.hasAccess,
        subscription_expires_at: subscriptionAccess.expiresAt,
        token_type: "refresh",
      }
    );

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
const otp_cycle = async (
  value: string | number,
  ip?: string | null,
  purpose?: "login" | "signup"
) => {
  const otp = random_otp();
  const now = new Date();
  const isPhone = typeof value === "number";
  const whereCondition = isPhone
    ? eq(otp_model.phone, value)
    : eq(otp_model.email, value);

  try {
    // IP-based ban logic for login OTP flow
    if (ip && purpose === "login") {
      const ipRecord = (
        await db
          .select()
          .from(otp_ip_rate_limit_model)
          .where(
            and(
              eq(otp_ip_rate_limit_model.ip, ip),
              eq(otp_ip_rate_limit_model.purpose, "otp-login-request")
            )
          )
          .limit(1)
      )[0];

      const bannedUntil =
        ipRecord?.banned_until && new Date(ipRecord.banned_until);
      if (bannedUntil && bannedUntil.getTime() > now.getTime()) {
        return {
          success: false,
          code: 429,
          message:
            "Too many OTP requests. Your IP is temporarily banned for 24 hours.",
          data: {
            banned_until: bannedUntil,
            reason:
              ipRecord?.reason ??
              "Exceeded OTP request limit (20+ in 5 minutes).",
          },
        };
      }

      const windowStart = ipRecord?.window_start
        ? new Date(ipRecord.window_start)
        : now;
      const inWindow = now.getTime() - windowStart.getTime() < OTP_IP_BAN_WINDOW_MS;
      const nextIpCount = inWindow ? (ipRecord?.count ?? 0) + 1 : 1;

      // Apply or extend ban if threshold reached
      if (nextIpCount >= OTP_IP_BAN_THRESHOLD) {
        const banUntilDate = new Date(now.getTime() + OTP_IP_BAN_DURATION_MS);
        if (ipRecord) {
          await db
            .update(otp_ip_rate_limit_model)
            .set({
              count: nextIpCount,
              window_start: inWindow ? windowStart : now,
              last_attempt: now,
              banned_until: banUntilDate,
              reason: "Exceeded OTP request limit (20+ in 5 minutes).",
            })
            .where(
              and(
                eq(otp_ip_rate_limit_model.ip, ip),
                eq(otp_ip_rate_limit_model.purpose, "otp-login-request")
              )
            );
        } else {
          await db.insert(otp_ip_rate_limit_model).values({
            ip,
            purpose: "otp-login-request",
            count: nextIpCount,
            window_start: now,
            last_attempt: now,
            banned_until: banUntilDate,
            reason: "Exceeded OTP request limit (20+ in 5 minutes).",
          });
        }

        return {
          success: false,
          code: 429,
          message:
            "Too many OTP requests. Your IP is temporarily banned for 24 hours.",
          data: {
            banned_until: banUntilDate,
            reason: "Exceeded OTP request limit (20+ in 5 minutes).",
          },
        };
      }

      // Update rate record for current attempt (non-banned)
      if (ipRecord) {
        await db
          .update(otp_ip_rate_limit_model)
          .set({
            count: nextIpCount,
            window_start: inWindow ? windowStart : now,
            last_attempt: now,
            banned_until: null,
            reason: null,
          })
          .where(
            and(
              eq(otp_ip_rate_limit_model.ip, ip),
              eq(otp_ip_rate_limit_model.purpose, "otp-login-request")
            )
          );
      } else {
        await db.insert(otp_ip_rate_limit_model).values({
          ip,
          purpose: "otp-login-request",
          count: nextIpCount,
          window_start: now,
          last_attempt: now,
        });
      }
    }

    const existing = (
      await db.select().from(otp_model).where(whereCondition).limit(1)
    )[0];

    const nextAttempts =
      existing && isSameDay(existing.created_at)
        ? (existing.attempts ?? 0) + 1
        : 1;

    if (nextAttempts > MAX_DAILY_OTP_ATTEMPTS) {
      return {
        success: false,
        code: 429,
        message: "Daily OTP limit reached. Please try again tomorrow.",
        data: {
          attempts_left: 0,
          expires_in_ms: OTP_EXPIRY_MS,
        },
      };
    }

    if (isPhone) {
      const message = generateOTPSmsMessage(otp);
      const smsResponse = await sendSMS({
        number: value.toString(),
        message,
      });

      if (!smsResponse.success) {
        console.error(
          "[SMS Service] Failed to send OTP SMS:",
          smsResponse.error
        );
        return {
          success: false,
          code: 500,
          message: `Failed to send OTP via SMS: ${smsResponse.error}`,
        };
      }
    } else {
      const emailResponse = await sendEmailOTP(
        value.toString(),
        otp.toString()
      );

      console.log("email response", emailResponse);

      if (!emailResponse || !emailResponse.success) {
        console.error("[Email Service] Failed to send OTP email");
        return {
          success: false,
          code: 500,
          message: "Failed to send OTP via email",
        };
      }
    }

    if (existing) {
      await db
        .update(otp_model)
        .set({
          otp,
          attempts: nextAttempts,
          created_at: now,
        })
        .where(whereCondition);
    } else {
      const otp_id = create_unique_id();
      const insertPayload: any = {
        id: otp_id,
        otp,
        attempts: nextAttempts,
        created_at: now,
      };

      if (isPhone) {
        insertPayload.phone = value;
      } else {
        insertPayload.email = value;
      }

      await db.insert(otp_model).values(insertPayload);
    }

    return {
      success: true,
      code: 200,
      message: `OTP sent to ${isPhone ? "phone" : "email"}: ${value}`,
      data: {
        attempts_left: Math.max(0, MAX_DAILY_OTP_ATTEMPTS - nextAttempts),
        expires_in_ms: OTP_EXPIRY_MS,
      },
    };
  } catch (error: any) {
    console.error("Error in otp_cycle:", error);
    return {
      success: false,
      code: 500,
      message: "Failed to process OTP request",
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
  check_ip_ban,
  record_failed_attempt,
};
