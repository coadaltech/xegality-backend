import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { pgTable, bigint, integer, varchar, char, text, jsonb, bigserial } from "drizzle-orm/pg-core";
import { user_model } from "../shared/user.model";
import { LANGUAGES_CONST, LAWYER_FEE_CONST, GENDER_CONST, PRACTICE_AREAS_CONST } from "../../types/user.types";
import { FIRM_TYPE_CONST } from "@/types/lawyer/firm.types";

const firm_model = pgTable("firms", {
  id: bigserial({ mode: "number" }).primaryKey(),
  name: varchar({ length: 100 }).notNull(),
  firm_type: varchar({ enum: FIRM_TYPE_CONST }).notNull(),
  established_year: integer(),
  number_of_lawyers: integer(),
  specialties: varchar({ enum: PRACTICE_AREAS_CONST }).array(),
  office_address: varchar({ length: 200 }),
  languages_supported: varchar({ enum: LANGUAGES_CONST }).array(),
  average_fee: integer(),
  fee_type: varchar({ enum: LAWYER_FEE_CONST }),
  bio: text(),
  website_url: text(),
  contact_email: varchar({ length: 80 }),
  contact_phone: bigint({ mode: "number" }),
  profile_picture: text(),
  created_by: bigint({ mode: "number" }).references(() => user_model.id),
});

type SelectFirmType = InferSelectModel<typeof firm_model>;
type InsertFirmType = InferInsertModel<typeof firm_model>;
type UpdateFirmType = Partial<Omit<InsertFirmType, 'id'>>;

export { firm_model };
export type { SelectFirmType, InsertFirmType, UpdateFirmType };

