import {
  integer,
  pgTable,
  text,
  varchar,
  timestamp,
  bigint,
  bigserial,
} from "drizzle-orm/pg-core";
import { user_model } from "./user.model";
import { case_model } from "./case.model";

// Message table definition
export const media_model = pgTable("media", {
  id: bigserial({ mode: "number" }).primaryKey(),
  url: text().notNull(),
  type: varchar({ length: 50 }).notNull(),
  size: integer().notNull(),
  uploader_id: bigint({ mode: "number" }).references(() => user_model.id, {
    onDelete: "cascade",
  }),
  case_id: varchar({ length: 20 }).references(() => case_model.id, {
    onDelete: "cascade",
  }),
  created_at: timestamp().defaultNow(),
});
