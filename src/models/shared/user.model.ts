import {
  pgTable,
  serial,
  text,
  timestamp,
  pgEnum,
  bigint,
  char,
  varchar,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { ROLE_CONST } from "../../types/user.types";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

const user_model = pgTable("users", {
  id: bigint({ mode: "number" }).primaryKey(),
  name: varchar({ length: 50 }).notNull(),
  role: varchar({ enum: ROLE_CONST }).notNull(),
  phone: bigint({ mode: "number" }).unique(),
  email: varchar({ length: 80 }).unique(),
  is_profile_complete: boolean().default(false),
  credits: integer().default(0),
  hashed_password: text(),
  refresh_token: text().notNull(),
  isdeleted: boolean().default(false),
  created_at: timestamp().defaultNow(),
  // last_online: timestamp().defaultNow(),
});

type UserType = InferSelectModel<typeof user_model>;
type InsertUserType = InferInsertModel<typeof user_model>;
type UpdateUserType = Partial<Omit<InsertUserType, "id" | "created_at">>;

export { user_model };
export type { UserType, InsertUserType, UpdateUserType };
