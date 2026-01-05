import jwt from "jsonwebtoken";
import "dotenv/config";
import bcrypt from "bcryptjs";

const random_otp = () => {
  return Math.floor(1000 + Math.random() * 9000);
};

const verify_refresh_token = (token: string) => {
  try {
    const payload = jwt.verify(token, process.env.ACCESS_KEY || "heymama");

    return { valid: true, payload };
  } catch (err) {
    return { valid: false };
  }
};

const create_unique_id = () => {
  return Math.floor(Math.random() * 1e12);
};

const verify_access_token = (token: string) => {
  try {
    const payload = jwt.verify(token, process.env.ACCESS_KEY || "heymama");

    return { valid: true, payload };
  } catch (err) {
    return { valid: false };
  }
};

const hash_password = async (password: string): Promise<string> => {
  const SALT = 10;
  const hashed_password = await bcrypt.hash(password, SALT);
  return hashed_password;
};

const generate_jwt = (
  payload:
    {
      id: number,
      role: string,
      is_profile_complete?: boolean,
      has_subscription_access?: boolean,
      subscription_expires_at?: Date | null
      token_type: 'access' | 'refresh'
    }
) => {
  return jwt.sign(
    {
      id: payload.id,
      role: payload.role,
      is_profile_complete: payload.is_profile_complete || false,
      has_subscription_access: payload.has_subscription_access || false,
      subscription_expires_at: payload.subscription_expires_at
        ? payload.subscription_expires_at.toISOString()
        : null,
    },
    process.env.ACCESS_KEY || "heymama",
    {
      expiresIn: payload.token_type === 'access' ? "15m" : "7d",
    }
  );
};

// const generate_refresh_jwt = (id: number, role: string) => {
//   return jwt.sign({ id, role }, process.env.ACCESS_KEY || "heymama", {
//     expiresIn: "7d",
//   });
// };

// const generate_refresh_jwt = (
//   payload:
//     {
//       id: number,
//       role: string,
//       is_profile_complete?: boolean,
//       has_subscription_access?: boolean,
//       subscription_expires_at?: Date | null
//     }
// ) => {
//   return jwt.sign(
//     {
//       id: payload.id,
//       role: payload.role,
//       is_profile_complete: payload.is_profile_complete || false,
//       has_subscription_access: payload.has_subscription_access || false,
//       subscription_expires_at: payload.subscription_expires_at
//         ? payload.subscription_expires_at.toISOString()
//         : null,
//     },
//     process.env.ACCESS_KEY || "heymama",
//     {
//       expiresIn: "7d",
//     }
//   );
// };

const verify_jwt = (token: string) => {
  return jwt.verify(token, process.env.ACCESS_KEY || "heymama");
};

const compare_password = async (password: string, hashed_password: string) => {
  return await bcrypt.compare(password, hashed_password);
};

const generate_case_id = (case_type: string) => {
  const firstTwoChars = case_type.slice(0, 2).toUpperCase();
  const currentYear = new Date().getFullYear();
  const randomNumber = Math.floor(Math.random() * 9000) + 1000;
  // Format the case ID as "XX-YYYY-XXXX"
  const caseId = `${firstTwoChars}-${currentYear}-${randomNumber
    .toString()
    .padStart(4, "0")}`;

  return caseId;
};

const format_time_spent = (milliseconds: number) => {
  const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );

  return `${days} days ${hours} hours`;
};

const format_days_since_date = (dateString: string) => {
  const openDate = new Date(dateString);
  const currentDate = new Date();
  const timeDifference = currentDate.getTime() - openDate.getTime();
  const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

  return `${days} days`;
};

const generate_application_id = () => {
  const firstTwoChars = "CA";
  const currentYear = new Date().getFullYear();
  const randomNumber = Math.floor(Math.random() * 9000) + 1000;
  // Format the case ID as "XX-YYYY-XXXX"
  const caseId = `${firstTwoChars}-${currentYear}-${randomNumber
    .toString()
    .padStart(4, "0")}`;

  return caseId;
};

export {
  random_otp,
  hash_password,
  generate_jwt,
  // generate_refresh_jwt,
  verify_jwt,
  compare_password,
  verify_refresh_token,
  verify_access_token,
  create_unique_id,
  format_time_spent,
  format_days_since_date,
  generate_case_id,
  generate_application_id,
};
