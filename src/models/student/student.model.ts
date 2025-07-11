import { pgTable, bigint, varchar, text, integer, real } from "drizzle-orm/pg-core";
import { user_model } from "../shared/user.model";
import { GENDER_CONST, PRACTICE_AREAS_CONST } from "../../types/user.types";

export const student_model = pgTable("students", {
  id: bigint({ mode: "number" }).primaryKey().references(() => user_model.id, { onDelete: 'cascade' }),
  gender: varchar({ enum: GENDER_CONST }),
  age: integer(),
  home_address: text(),
  current_location: text(),
  law_school: varchar({ length: 300 }),
  degree: varchar({ length: 100 }),
  graduation_year: integer(),
  cgpa: real(),
  area_of_interest: varchar({ enum: PRACTICE_AREAS_CONST }).array(),
  linked_in_profile: text(),
  profile_picture: text(),
});


