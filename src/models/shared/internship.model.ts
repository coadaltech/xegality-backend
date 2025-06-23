import { bigint, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user_model } from "./user.model";

export const applied_internship_model = pgTable("applied_internships", {
  internship_id: bigint({ mode: "number" })
    .primaryKey()
    .notNull()
    .references(() => internship_model.id),
  student_id: bigint({ mode: "number" })
    .notNull()
    .references(() => user_model.id),
  applied_at: timestamp({ withTimezone: true }).defaultNow(),
  status: text().default("applied"),
});

export const posted_internship_model = pgTable("posted_internships", {
  internship_id: bigint({ mode: "number" })
    .primaryKey()
    .notNull()
    .references(() => internship_model.id),
  lawyer_id: bigint({ mode: "number" })
    .notNull()
    .references(() => user_model.id),
  posted_at: timestamp({ withTimezone: true }).defaultNow(),
  status: text().default("open"),
});
export const internship_model = pgTable("internships", {
  id: bigint({ mode: "number" }).primaryKey(),
  title: text().notNull(),
  description: text().notNull(),
  location: text().notNull(),
  specialization: text().notNull(),
  designation: text().notNull(),
  duration: text().notNull(),
  compensation_type: text(),
  salary_amount: text(),
  application_deadline: timestamp({ withTimezone: true }).notNull(),
  requirements: text().array(),
  benefits: text().array(),
  posted_by: bigint({ mode: "number" })
    .notNull()
    .references(() => user_model.id),
  posted_date: timestamp({ withTimezone: true }).defaultNow(),
});
