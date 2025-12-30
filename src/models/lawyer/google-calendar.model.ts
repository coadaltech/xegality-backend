import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import {
  pgTable,
  bigint,
  varchar,
  text,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";
import { user_model } from "../shared/user.model";
import { serial } from "drizzle-orm/pg-core";

const google_calendar_tokens_model = pgTable("google_calendar_tokens", {
  id: serial().primaryKey(),
  lawyer_id: bigint({ mode: "number" })
    .references(() => user_model.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  access_token: text().notNull(),
  refresh_token: text(),
  expiry_date: bigint({ mode: "number" }),
  calendar_id: varchar({ length: 255 }).default("primary"),
  is_active: boolean().default(true),
  created_at: timestamp().defaultNow(),
  updated_at: timestamp().defaultNow(),
});

type GoogleCalendarTokenType = InferSelectModel<typeof google_calendar_tokens_model>;
type InsertGoogleCalendarTokenType = InferInsertModel<typeof google_calendar_tokens_model>;
type UpdateGoogleCalendarTokenType = Partial<Omit<InsertGoogleCalendarTokenType, "id" | "lawyer_id">>;

export { google_calendar_tokens_model };
export type {
  GoogleCalendarTokenType,
  InsertGoogleCalendarTokenType,
  UpdateGoogleCalendarTokenType,
};
