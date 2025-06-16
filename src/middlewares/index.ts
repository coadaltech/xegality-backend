import jwt from "jsonwebtoken";

const secretKey = process.env.ACCESS_KEY || "heymama";

export const authenticate_jwt = (access_token: string) => {
  try {
    const decoded = jwt.verify(access_token, secretKey);
    return {
      success: true,
      code: 200,
      message: "Valid Access Token",
      data: decoded,
    };
  } catch (err) {
    return {
      success: false,
      code: 401,
      message: "Inalid Access Token",
    };
  }
};
