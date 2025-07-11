import { pgTable, bigint, varchar, text, integer } from "drizzle-orm/pg-core";
import { user_model } from "../shared/user.model";
import { GENDER_CONST } from "../../types/user.types";
import { EMPLOYMENT_STATUS_CONST, MARITAL_STATUS_CONST } from "../../types/consumer.types";

export const consumer_model = pgTable("consumers", {
  id: bigint({ mode: "number" }).primaryKey().references(() => user_model.id, { onDelete: 'cascade' }),
  gender: varchar({ enum: GENDER_CONST }),
  age: integer(),
  employment_status: varchar({ enum: EMPLOYMENT_STATUS_CONST }),
  marital_status: varchar({ enum: MARITAL_STATUS_CONST }),
  home_address: text(),
  current_location: text(),
  profile_picture: text(),
});


