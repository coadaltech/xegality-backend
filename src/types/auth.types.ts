import { t } from "elysia";
import { ROLE_CONST } from "./user.types";

const VerifyLoginOtpSchema = t.Object({
  phone: t.Optional(t.Number()),
  email: t.Optional(t.String()),
  otp: t.Number(),
});

const VerifyUserSchema = t.Object({
  name: t.String(),
  password: t.String(),
  phone: t.Optional(t.Number()),
  role: t.Enum(Object.fromEntries(ROLE_CONST.map(area => [area, area]))),
  email: t.Optional(t.String()),
  otp: t.Number(),
});

const UserSchema = t.Object({
  name: t.String(),
  password: t.String(),
  phone: t.Number(),
  role: t.Enum(Object.fromEntries(ROLE_CONST.map(area => [area, area]))),
  email: t.Optional(t.String()),
});

const GoogleCallbackSchema = t.Object({
  code: t.String(),
  state: t.String(),
});

const GenerateOtpSchema = t.Object({
  phone: t.Optional(t.Number()),
  email: t.Optional(t.String()),
  purpose: t.Optional(t.Union([t.Literal("login"), t.Literal("signup")])),
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

type OtpType = (typeof VerifyUserSchema)["static"];

type SignUpType = (typeof UserSchema)["static"];

export {
  SignUpType,
  OtpType,
  JWTUser,
  VerifyUserSchema,
  UserSchema,
  GenerateOtpSchema,
  LoginSchema,
  GoogleCallbackSchema,
  VerifyLoginOtpSchema,
};
