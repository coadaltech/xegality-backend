import jwt from "jsonwebtoken";
import "dotenv/config";
import bcrypt from "bcrypt";
import { password } from "bun";

const random_otp = () => {
  return Math.floor(1000 + Math.random() * 9000);
};

const hash_password = async (password: string): Promise<string> => {
  const SALT = 10;
  const hashed_password = await bcrypt.hash(password, SALT);
  return hashed_password;
};
const generate_jwt = (phone: number, role: string) => {
  return jwt.sign({ phone, role }, process.env.ACCESS_KEY || "heymama", {
    expiresIn: "1m",
  });
};
const verify_jwt = (token: string) => {
  return jwt.verify(token, process.env.ACCESS_KEY || "heymama");
};
const generate_refresh_jwt = (phone: number, role: string) => {
  return jwt.sign({ phone, role }, process.env.ACCESS_KEY || "heymama", {
    expiresIn: "7d",
  });
};
const compare_password = async (password: string, hashed_password: string) => {
  return await bcrypt.compare(password, hashed_password);
};
export {
  random_otp,
  hash_password,
  generate_jwt,
  generate_refresh_jwt,
  verify_jwt,
  compare_password,
};
