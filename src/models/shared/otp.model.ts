import { integer, serial, pgTable, text, bigint } from "drizzle-orm/pg-core";

const otp_model = pgTable("otps", {
  id: serial().primaryKey(),
  phone: bigint({ mode: "number" }).unique(),
  email: text("email"),
  otp: integer("otp"),
});

export { otp_model };