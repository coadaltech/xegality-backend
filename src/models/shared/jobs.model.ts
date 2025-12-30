import {
  bigint,
  bigserial,
  date,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { user_model } from "./user.model";
import { JOB_APPLICATION_STATUS_CONST } from "@/types/shared/jobs.types";
import { PRACTICE_AREAS_CONST } from "@/types/user.types";

export const applied_jobs_model = pgTable("applied_jobs", {
  id: bigserial({ mode: "number" }).primaryKey().notNull(),
  job_id: bigint({ mode: "number" })
    .notNull()
    .references(() => jobs_model.id),
  applicant_id: bigint({ mode: "number" })
    .notNull()
    .references(() => user_model.id),
  applied_at: timestamp({ withTimezone: true }).defaultNow(),
  status: varchar({ enum: JOB_APPLICATION_STATUS_CONST }).default("applied"),
  notes: text(),
  interview_scheduled: timestamp({ withTimezone: true }),
  interview_notes: text(),
});

export const jobs_model = pgTable("jobs", {
  id: bigint({ mode: "number" }).primaryKey(),
  title: text().notNull(),
  description: text().notNull(),
  location: text().notNull(),
  specialization: varchar({ enum: PRACTICE_AREAS_CONST }).array().notNull(),
  designation: text().notNull(),
  type: text().notNull(), // full-time, part-time, contract, internship
  duration: text().notNull(),
  compensation_type: text(),
  salary_amount: text(),
  application_deadline: timestamp({ withTimezone: true }).notNull(),
  requirements: text().array(),
  benefits: text().array(),
  posted_by: bigint({ mode: "number" })
    .notNull()
    .references(() => user_model.id),
  posted_date: date().defaultNow(),
  // tags: pgEnum("tags", TAGENUM)().array()
});

