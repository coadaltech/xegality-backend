import db from "../../config/db";
import { signupBody } from "../../types/auth.types";
import { generateOTP } from "../../utils";
import { t } from "elysia";

const otp_schema = t.Object({
  phone: t.String(),
});

const generate_otp = (body: signupBody) => {
  const generatedOTP = generateOTP();
  console.log(generatedOTP);
  console.log(body.phone_number);
  // storeOTP(generatedOTP)
  // OTP
  // DB
  // JWT
};

export { generate_otp };
