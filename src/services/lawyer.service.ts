import db from "../config/db";
import { SignupBody } from "../types/auth.types";
import { generateOTP } from "../utils";

const handle_signup = (body: SignupBody) => {
  console.log(body.phone);
  const generatedOTP = generateOTP();
//   storeOTP(generatedOTP)
  // OTP
  // DB
  // JWT
};

export { handle_signup };
