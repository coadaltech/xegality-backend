import { integer, pgTable, serial, text, varchar, boolean, timestamp, bigint } from 'drizzle-orm/pg-core';
import { user_model } from './user.model';

// Message table definition
export const media_model = pgTable('media', {
  id: serial().primaryKey(),
  url: text().notNull(),
  type: varchar({ length: 50 }).notNull(),
  size: integer().notNull(),
  uploader_id: bigint({ mode: "number" }).references(() => user_model.id, { onDelete: 'cascade' }),
  created_at: timestamp().defaultNow(),
});
