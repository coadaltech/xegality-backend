import { t } from "elysia";

export const signupSchema = t.Object({
  name: t.String(),
  password: t.String(),
  phone_number: t.Number(),
  sender: t.String(),
});

type SignupBody = (typeof signupSchema)["static"];
