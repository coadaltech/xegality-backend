import { pgTable, serial, text, timestamp, integer, date, varchar, char, bigint, json, pgEnum } from "drizzle-orm/pg-core";
import { STATUS_CONST, PRIRORITY_CONST, TimelineEntry } from "../../types/case.types";
import { user_model } from "./user.model";
import { PRACTICE_AREAS_CONST } from "../../types/user.types";

export const case_model = pgTable("cases", {
  id: varchar({ length: 20 }).primaryKey(),
  title: varchar({ length: 100 }).notNull(),
  description: text().notNull(),
  type: varchar({ enum: PRACTICE_AREAS_CONST }).notNull(),
  assigned_to: varchar({ length: 50 }).notNull(),
  assigned_by: bigint({ mode: "number" }).notNull().references(() => user_model.id).notNull(),
  status: varchar({ enum: STATUS_CONST }).default("opened"),
  priority: varchar({ enum: PRIRORITY_CONST }).default("normal"),
  open_date: timestamp({ withTimezone: true }).notNull(),
  consumer_id: bigint({ mode: "number" }).notNull().references(() => user_model.id).notNull(),
  consumer_name: varchar({ length: 50 }).notNull(),
  consumer_phone: bigint({ mode: "number" }).notNull(),
  consumer_age: integer().notNull(),
  consumer_address: text().notNull(),
  consumer_documents: text().array().default([]),
  timeline: json().$type<TimelineEntry[]>().default([{
    id: 1,
    title: "Case Opened",
    description: "Case is initiated",
  }]),
  created_at: timestamp().defaultNow(),
  updated_at: timestamp().defaultNow(),
});
