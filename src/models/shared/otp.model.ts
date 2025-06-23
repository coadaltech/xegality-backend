import { integer, serial, pgTable, text, bigint } from "drizzle-orm/pg-core";

const otp_model = pgTable("otps", {
  id: bigint({ mode: "number" }).primaryKey(),
  phone: bigint({ mode: "number" }).unique(),
  email: text(),
  otp: integer().notNull(),
});

export { otp_model };
