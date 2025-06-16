import jwt from "jsonwebtoken";
import "dotenv/config";
import bcrypt from "bcrypt";

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
const hash_password = async (password: string): Promise<string> => {
  const SALT = 10;
  const hashed_password = await bcrypt.hash(password, SALT);
  return hashed_password;
};
const generate_jwt = (id: string, role: string) => {
  return jwt.sign({ id, role }, process.env.ACCESS_KEY || "heymama", {
    expiresIn: "1h",
  });
};
const verify_jwt = (token: string) => {
  return jwt.verify(token, process.env.ACCESS_KEY || "heymama");
};
const generate_refresh_jwt = (id: string, role: string) => {
  return jwt.sign({ id, role }, process.env.ACCESS_KEY || "heymama", {
    expiresIn: "5m",
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
  verify_refresh_token,
};
