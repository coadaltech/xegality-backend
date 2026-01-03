import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { pgTable, bigint, integer, varchar, char, text, jsonb } from "drizzle-orm/pg-core";
import { user_model } from "../shared/user.model";
import { LANGUAGES_CONST, LAWYER_FEE_CONST, GENDER_CONST, PRACTICE_AREAS_CONST } from "../../types/user.types";

const lawyer_profile_model = pgTable("lawyers", {
  id: bigint({ mode: "number" }).primaryKey().references(() => user_model.id, { onDelete: 'cascade' }),
  experience: integer().notNull(),
  gender: varchar({ enum: GENDER_CONST }).notNull(),
  age: integer().notNull(),
  bio: text().notNull(),
  bar_number: varchar({ length: 20 }).notNull(),
  practice_areas: varchar({ enum: PRACTICE_AREAS_CONST }).array().notNull(),
  law_firm: varchar({ length: 100 }),
  law_firm_id: bigint({ mode: "number" }),
  practice_location: varchar({ length: 100 }).notNull(),
  practicing_courts: varchar({ length: 100 }).array(),
  home_address: text(),
  languages: varchar({ enum: LANGUAGES_CONST }).array().notNull(),
  fee: integer(),
  fee_type: varchar({ enum: LAWYER_FEE_CONST }).notNull(),
  rating: integer().default(0),
  profile_picture: text(),

  // additional fields
  // availability_status: varchar({ enum: ["available", "busy", "not_accepting"] }).default("available"),
  // consultation_modes: varchar().array(),
  // consultation_duration: integer(),
  // consultation_fee: integer(),
  // availability_schedule: jsonb(),

  // linkedin_url: text(),
  // awards: jsonb(),

  // reviews: jsonb(),
});

type LawyerType = InferSelectModel<typeof lawyer_profile_model>;
type InsertLawyerType = InferInsertModel<typeof lawyer_profile_model>;
type UpdateLawyerType = Partial<Omit<InsertLawyerType, 'id'>>;
type LawyerWithUserType = LawyerType & Omit<InferSelectModel<typeof user_model>, 'id' | 'password' | 'role' | 'created_at' | 'refresh_token'>;
type UpdateLawyerWithUserType = Partial<LawyerWithUserType>;

export { lawyer_profile_model };
export type { LawyerType, InsertLawyerType, UpdateLawyerType, LawyerWithUserType, UpdateLawyerWithUserType };
