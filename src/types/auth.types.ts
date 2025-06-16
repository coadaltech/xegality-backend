import { t } from "elysia";

const OtpSchema = t.Object({
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

const SignupSchema = t.Object({
  phone: t.Optional(t.Number()),
  email: t.Optional(t.String()),
});
const LoginSchema = t.Object({
  password: t.String(),
  phone: t.Optional(t.Number()),
  email: t.Optional(t.String()),
});

type RoleType = "consumer" | "lawyer" | "student";
type OtpType = (typeof OtpSchema)["static"];
type SignUpType = (typeof UserSchema)["static"];

export {
  SignUpType,
  OtpType,
  OtpSchema,
  UserSchema,
  RoleType,
  SignupSchema,
  LoginSchema,
};
