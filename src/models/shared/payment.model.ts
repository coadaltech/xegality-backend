import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { pgTable, varchar, bigint, integer, text, jsonb, timestamp, char } from "drizzle-orm/pg-core";
import { user_model } from "./user.model";

const payment_model = pgTable("payments", {
  id: varchar({ length: 50 }).primaryKey(),
  user_id: bigint({ mode: "number" }).references(() => user_model.id, { onDelete: 'cascade' }).notNull(),
  order_id: varchar({ length: 50 }).notNull().unique(),
  payment_id: varchar({ length: 50 }),
  amount: integer().notNull(), // Amount in paise
  currency: varchar({ length: 3 }).notNull().default("INR"),
  status: varchar({ length: 20 }).notNull().default("pending"), // pending, completed, failed, refunded
  receipt: varchar({ length: 50 }).notNull(),
  notes: jsonb(),
  razorpay_response: jsonb(), // Store full Razorpay response for debugging
  created_at: timestamp().defaultNow().notNull(),
  updated_at: timestamp().defaultNow().notNull(),
});

type PaymentModelType = InferSelectModel<typeof payment_model>;
type InsertPaymentType = InferInsertModel<typeof payment_model>;
type UpdatePaymentType = Partial<InsertPaymentType>;

export { payment_model };
export type { PaymentModelType, InsertPaymentType, UpdatePaymentType };
