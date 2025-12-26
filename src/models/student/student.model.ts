import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import {
  pgTable,
  bigint,
  integer,
  varchar,
  text,
  real,
  date,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";
import { user_model } from "../shared/user.model";
import {
  LANGUAGES_CONST,
  GENDER_CONST,
  PRACTICE_AREAS_CONST,
} from "../../types/user.types";

const student_profile_model = pgTable("students", {
  id: bigint({ mode: "number" })
    .primaryKey()
    .references(() => user_model.id, { onDelete: "cascade" }),
  gender: varchar({ enum: GENDER_CONST }).notNull(),
  age: integer().notNull(),
  home_address: text(),
  languages: varchar({ enum: LANGUAGES_CONST }).array().notNull(),
  profile_picture: text(),
  cover_image: text(),
  profile_headline: text(),
  bio: text(),

  // Academic
  university_name: varchar().notNull(),
  degree: varchar({ length: 100 }),
  grades: real(),
  passing_year: date(),

  // Application
  practice_area_interests: varchar({ enum: PRACTICE_AREAS_CONST })
    .array()
    .notNull(),
  prior_internships: jsonb(),
  cv_resume: text(), // URL to the document actually aws s3 bucket url
  linkedin_url: text(),

  // Availability
  availability: date(),
  preferred_locations: varchar({ length: 50 }).array(),
  remote_ok: boolean().default(false),
});

type StudentType = InferSelectModel<typeof student_profile_model>;
type InsertStudentType = InferInsertModel<typeof student_profile_model>;
type UpdateStudentType = Partial<Omit<InsertStudentType, "id">>;
type StudentWithUserType = StudentType &
  Omit<
    InferSelectModel<typeof user_model>,
    "id" | "password" | "role" | "created_at" | "refresh_token"
  >;
type UpdateStudentWithUserType = Partial<StudentWithUserType>;

export { student_profile_model };
export type {
  StudentType,
  InsertStudentType,
  UpdateStudentType,
  StudentWithUserType,
  UpdateStudentWithUserType,
};
