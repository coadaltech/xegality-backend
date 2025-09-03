import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { pgTable, bigint, integer, varchar, char, text } from "drizzle-orm/pg-core";
import { user_model } from "../shared/user.model";
import { LANGUAGES_CONST, LAWYER_FEE_CONST, GENDER_CONST, PRACTICE_AREAS_CONST, MARITAL_STATUS_CONST } from "../../types/user.types";

const consumer_profile_model = pgTable("consumers", {
  id: bigint({ mode: "number" }).primaryKey().references(() => user_model.id, { onDelete: 'cascade' }),
  gender: varchar({ enum: GENDER_CONST }).notNull(),
  age: integer().notNull(),
  marital_status: varchar({ enum: MARITAL_STATUS_CONST }),
  home_address: text(),
  postal_pincode: integer(),
  profile_picture: text(),
});

type ConsumerType = InferSelectModel<typeof consumer_profile_model>;
type InsertConsumerType = InferInsertModel<typeof consumer_profile_model>;
type UpdateConsumerType = Partial<Omit<InsertConsumerType, 'id'>>;
type ConsumerWithUserType = ConsumerType & Omit<InferSelectModel<typeof user_model>, 'id' | 'password' | 'role' | 'created_at' | 'refresh_token'>;
type UpdateConsumerWithUserType = Partial<ConsumerWithUserType>;

export { consumer_profile_model };
export type { ConsumerType, InsertConsumerType, UpdateConsumerType, ConsumerWithUserType, UpdateConsumerWithUserType };
