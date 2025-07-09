import { pgTable, bigint, serial, varchar, integer, text, json, timestamp, char } from "drizzle-orm/pg-core";
import { user_model } from "../shared/user.model";
import { TimelineEntry } from "../../types/case.types";
import { APPLICATION_STATUS_CONST } from "../../types/ca.types";

export const application_model = pgTable("applications", {
  id: varchar({ length: 50 }).primaryKey(),
  title: varchar({ length: 100 }).notNull(),
  description: text(),
  category: varchar({ length: 80 }).notNull(),
  status: varchar({ enum: APPLICATION_STATUS_CONST }).default("in_progress"),
  open_date: timestamp({ withTimezone: true }).notNull(),
  handled_by: bigint({ mode: "number" }).notNull().references(() => user_model.id, { onDelete: 'cascade' }),
  consumer_id: bigint({ mode: "number" }).notNull().references(() => user_model.id).notNull(),
  consumer_name: varchar({ length: 50 }).notNull(),
  consumer_phone: bigint({ mode: "number" }).notNull(),
  consumer_age: integer(),
  consumer_address: text(),
  consumer_documents: text().array().default([]),
  timeline: json().$type<TimelineEntry[]>().default([
    {
      id: 1,
      title: "Application Submitted",
      description: "Case is initiated",
    }
  ]),
  updated_at: timestamp().defaultNow(),
});

