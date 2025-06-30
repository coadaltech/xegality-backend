import {
  pgTable,
  serial,
  text,
  timestamp,
  pgEnum,
  bigint,
} from "drizzle-orm/pg-core";

const UserTypeEnum = pgEnum("role", ["consumer", "lawyer", "student","paralegal"]);

const user_model = pgTable("users", {
  id: bigint({ mode: "number" }).primaryKey(),
  name: text().notNull(),
  role: UserTypeEnum().notNull(),
  phone: bigint({ mode: "number" }).unique(),
  email: text().unique(),
  hashed_password: text(),
  refresh_token: text().notNull(),
  applied_internships: text().array().notNull().default([]),
  profile_pic: text(),
  created_at: timestamp().defaultNow(),
});

export { user_model, UserTypeEnum };
