import { pgTable, bigint, integer, varchar, char, text, real } from "drizzle-orm/pg-core";
import { user_model } from "../shared/user.model";
import { LANGUAGES_CONST, LAWYER_FEE_CONST, GENDER_CONST, PRACTICE_AREAS_CONST } from "../../types/user.types";

export const lawyer_model = pgTable("lawyers", {
  id: bigint({ mode: "number" }).primaryKey().references(() => user_model.id, { onDelete: 'cascade' }),
  experience: integer(),
  gender: varchar({ enum: GENDER_CONST }),
  age: integer(),
  bio: text(),
  bar_number: varchar({ length: 30 }),
  bar_state: varchar({ length: 100 }),
  practice_area: varchar({ enum: PRACTICE_AREAS_CONST }),
  practice_location: varchar({ length: 200 }),
  practicing_courts: varchar({ length: 100 }).array(),
  home_address: text(),
  languages: varchar({ enum: LANGUAGES_CONST }).array(),
  fee: integer(),
  fee_type: varchar({ enum: LAWYER_FEE_CONST }),
  rating: real().default(0),
  profile_picture: text(),
});


