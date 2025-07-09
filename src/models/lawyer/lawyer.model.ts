import { pgTable, bigint, integer, varchar, char, text } from "drizzle-orm/pg-core";
import { user_model } from "../shared/user.model";
import { LANGUAGES_CONST, LAWYER_FEE_CONST, GENDER_CONST, PRACTICE_AREAS_CONST } from "../../types/user.types";

export const lawyer_model = pgTable("lawyers", {
  id: bigint({ mode: "number" }).primaryKey().references(() => user_model.id, { onDelete: 'cascade' }),
  experience: integer().notNull(),
  gender: varchar({ enum: GENDER_CONST }),
  bio: text().notNull(),
  bar_number: varchar({ length: 20 }).notNull(),
  bar_state: varchar({ length: 50 }).notNull(),
  practice_area: varchar({ enum: PRACTICE_AREAS_CONST }).notNull(),
  practice_location: varchar({ length: 50 }).notNull(),
  practicing_courts: varchar({ length: 50 }).array(),
  home_address: text(),
  languages: varchar({ enum: LANGUAGES_CONST }).array().notNull(),
  fee: integer(),
  fee_type: varchar({ enum: LAWYER_FEE_CONST }).notNull(),
  rating: integer().default(0),
  profile_picture: text(),
});


