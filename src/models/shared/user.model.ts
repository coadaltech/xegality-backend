import {
  pgTable,
  serial,
  text,
  timestamp,
  pgEnum,
  bigint,
} from "drizzle-orm/pg-core";

const UserTypeEnum = pgEnum("role", ["consumer", "lawyer", "student"]);

const user_model = pgTable("users", {
  id: text().primaryKey(),
  name: text().notNull(),
  role: UserTypeEnum().notNull(),
  phone: bigint({ mode: "number" }).unique(),
  email: text().unique(),
  hashed_password: text(),
  refresh_token: text().notNull(),
  profile_pic: text(),
  created_at: timestamp().defaultNow(),
});

export { user_model, UserTypeEnum };
