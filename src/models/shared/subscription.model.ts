import {
  pgTable,
  bigint,
  varchar,
  timestamp,
  boolean,
  integer,
  serial,
} from "drizzle-orm/pg-core";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { user_model } from "./user.model";

const subscription_model = pgTable("subscriptions", {
  id: serial().primaryKey(),
  user_id: bigint({ mode: "number" })
    .references(() => user_model.id)
    .notNull(),
  plan_id: varchar({ length: 50 }).notNull(), // basic, student, premium, starter, professional, enterprise
  plan_name: varchar({ length: 100 }).notNull(),
  price: integer().notNull(), // in paise
  status: varchar({
    enum: ["active", "inactive", "cancelled", "expired"],
  }).default("active"),
  start_date: timestamp().defaultNow(),
  end_date: timestamp().notNull(),
  auto_renew: boolean().default(true),
  payment_method: varchar({ length: 50 }), // razorpay, stripe, etc
  transaction_id: varchar({ length: 100 }),
  created_at: timestamp().defaultNow(),
  updated_at: timestamp().defaultNow(),
});

type SubscriptionType = InferSelectModel<typeof subscription_model>;
type InsertSubscriptionType = InferInsertModel<typeof subscription_model>;
type UpdateSubscriptionType = Partial<
  Omit<InsertSubscriptionType, "id" | "created_at">
>;

export { subscription_model };
export type {
  SubscriptionType,
  InsertSubscriptionType,
  UpdateSubscriptionType,
};
