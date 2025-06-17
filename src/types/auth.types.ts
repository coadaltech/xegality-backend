import { t } from "elysia";

const VerifyUserSchema = t.Object({
  name: t.String(),
  password: t.String(),
  phone: t.Optional(t.Number()),
  role: t.Enum({
    consumer: "consumer",
    lawyer: "lawyer",
    student: "student",
  }),
  email: t.Optional(t.String()),
  otp: t.Number(),
});
const UserSchema = t.Object({
  name: t.String(),
  password: t.String(),
  phone: t.Number(),
  role: t.Enum({
    consumer: "consumer",
    lawyer: "lawyer",
    student: "student",
  }),
  email: t.Optional(t.String()),
});
const GoogleCallbackSchema = t.Object({
  code: t.String(),
  state: t.String(),
});
const GenerateOtpSchema = t.Object({
  phone: t.Optional(t.Number()),
  email: t.Optional(t.String()),
});
const LoginSchema = t.Object({
  password: t.String(),
  phone: t.Optional(t.Number()),
  email: t.Optional(t.String()),
});
type JWTUser = {
  id: string;
  role: string;
};
type RoleType = "consumer" | "lawyer" | "student";
type OtpType = (typeof VerifyUserSchema)["static"];
type SignUpType = (typeof UserSchema)["static"];

export {
  SignUpType,
  OtpType,
  JWTUser,
  RoleType,
  VerifyUserSchema,
  UserSchema,
  GenerateOtpSchema,
  LoginSchema,
  GoogleCallbackSchema,
};
