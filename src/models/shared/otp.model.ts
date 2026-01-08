import { integer, serial, pgTable, text, bigint, timestamp } from "drizzle-orm/pg-core";

const otp_model = pgTable("otps", {
  id: bigint({ mode: "number" }).primaryKey(),
  phone: bigint({ mode: "number" }).unique(),
  email: text(),
  otp: integer().notNull(),
  attempts: integer().default(0),
  created_at: timestamp().defaultNow(),
});

export { otp_model };
