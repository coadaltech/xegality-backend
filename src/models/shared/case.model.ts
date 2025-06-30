import { pgTable, serial, text, timestamp, integer, date, varchar, char, bigint, json, pgEnum } from "drizzle-orm/pg-core";
import { TAGENUM, STATUSENUM, PRIRORITYENUM, TimelineEntry } from "../../types/app.types";
import { user_model } from "./user.model";

const CaseTypeEnum = pgEnum("type", TAGENUM);

export const case_model = pgTable("cases", {
    id: serial().primaryKey(),
    assigned_to: varchar({ length: 50 }).notNull(),
    assigned_by: bigint({ mode: "number" }).notNull().references(() => user_model.id).notNull(),
    status: char({ enum: STATUSENUM }).default("opened"),
    priority: char({ enum: PRIRORITYENUM }).default("normal"),
    open_date: timestamp({ withTimezone: true }).notNull(),
    description: text().notNull(),
    client_name: varchar({ length: 50 }).notNull(),
    client_address: text().notNull(),
    client_documents: text().array().default([]),
    client_age: integer().notNull(),
    phone: bigint({ mode: "number" }).unique().notNull(),
    timeline: json().$type<TimelineEntry[]>().array().default([{
        id: 1,
        title: "Case Opened",
        description: "Case is initiated",
        startedAt: new Date()
    }]),
    created_at: timestamp().defaultNow(),
});
