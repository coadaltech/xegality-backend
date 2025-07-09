import { pgTable, serial, text, timestamp, pgEnum, bigint, char, varchar, } from "drizzle-orm/pg-core";
import { ROLE_CONST } from "../../types/user.types";

const user_model = pgTable("users", {
  id: bigint({ mode: "number" }).primaryKey(),
  name: varchar({ length: 50 }).notNull(),
  role: varchar({ enum: ROLE_CONST }).notNull(),
  phone: bigint({ mode: "number" }).unique(),
  email: varchar({ length: 80 }).unique(),
  hashed_password: text(),
  refresh_token: text().notNull(),
  applied_internships: text().array().notNull().default([]),
  created_at: timestamp().defaultNow(),
});

export { user_model };
