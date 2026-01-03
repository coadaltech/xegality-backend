import {
  bigint,
  bigserial,
  boolean,
  date,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { user_model } from "./user.model";
import { JOB_APPLICATION_STATUS_CONST, JOB_TYPE_CONST } from "@/types/shared/jobs.types";
import { PRACTICE_AREAS_CONST } from "@/types/user.types";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

const applied_jobs_model = pgTable("applied_jobs", {
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

const jobs_model = pgTable("jobs", {
  id: bigint({ mode: "number" }).primaryKey(),
  title: text().notNull(),
  law_firm: varchar({ length: 200 }),
  description: text().notNull(),
  responsibilities: text().array(),
  location: varchar({ length: 200 }).notNull(),
  domain: varchar({ enum: PRACTICE_AREAS_CONST }).array().notNull(),
  designation: text().notNull(),
  type: varchar({ enum: JOB_TYPE_CONST }).array().notNull(),
  is_remote: boolean().default(false),
  required_experience: varchar({ length: 100 }),
  required_education: varchar({ length: 200 }),
  salary_pay: varchar({ length: 100 }),
  compensation_type: varchar({ length: 100 }),
  duration: varchar({ length: 100 }),
  application_deadline: timestamp({ withTimezone: true }).notNull(),
  required_skills: varchar({ length: 100 }).array(),
  benefits: varchar({ length: 200 }).array(),
  posted_by: bigint({ mode: "number" })
    .notNull()
    .references(() => user_model.id),
  posted_date: timestamp({ withTimezone: true }).defaultNow()
});


type SelectJobType = InferSelectModel<typeof jobs_model>;
type InsertJobType = InferInsertModel<typeof jobs_model>;
type UpdateJobType = Partial<Omit<InsertJobType, "id" | "posted_by" | "posted_date">>;

type AppliedJobType = InferSelectModel<typeof applied_jobs_model>;
type InsertAppliedJobType = InferInsertModel<typeof applied_jobs_model>;
type UpdateAppliedJobType = Partial<Omit<InsertAppliedJobType, "id">>;

export { jobs_model, applied_jobs_model };
export type {
  SelectJobType,
  InsertJobType,
  UpdateJobType,
  AppliedJobType,
  InsertAppliedJobType,
  UpdateAppliedJobType,
};

