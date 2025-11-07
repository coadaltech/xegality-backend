import { integer, pgTable, serial, text, varchar, boolean, timestamp, bigint } from 'drizzle-orm/pg-core';
import { user_model } from './user.model';
import { media_model } from './docs.model';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';

// Message table definition
const transaction_model = pgTable('transactions', {
  id: varchar({ length: 30 }).primaryKey(),
  amount: integer().notNull(),
  currency: varchar({ length: 10 }).notNull(),
  status: varchar({ length: 20 }).notNull(), // pending, completed, failed
  user_id: bigint({ mode: "number" }).references(() => user_model.id, { onDelete: 'cascade' }),
  payment_method: varchar({ length: 50 }),
  created_at: timestamp().defaultNow(),
});

type TransactionType = InferSelectModel<typeof transaction_model>;
type InsertTransactionType = InferInsertModel<typeof transaction_model>;
type UpdateTransactionType = Partial<InsertTransactionType>;

export { transaction_model, TransactionType, InsertTransactionType, UpdateTransactionType };

