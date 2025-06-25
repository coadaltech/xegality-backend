import { integer, pgTable, serial, text, varchar, boolean, timestamp, bigint } from 'drizzle-orm/pg-core';
import { user_model } from './user.model';

// Message table definition
export const messages_model = pgTable('messages', {
  id: serial().primaryKey(),
  from: bigint({ mode: "number" }).references(() => user_model.id, { onDelete: 'cascade' }),
  to: bigint({ mode: "number" }).references(() => user_model.id, { onDelete: 'cascade' }),
  content: text(),
  attachment_url: text(),
  attachment_type: varchar({ length: 50 }),
  seen: boolean().default(false),
  created_at: timestamp().defaultNow(),
});

export const user_connections_model = pgTable('connections', {
  id: serial().primaryKey(),
  user1_id: bigint({ mode: "number" }).references(() => user_model.id, { onDelete: 'cascade' }),
  user2_id: bigint({ mode: "number" }).references(() => user_model.id, { onDelete: 'cascade' }),
  initiated_by: bigint({ mode: "number" }).references(() => user_model.id, { onDelete: 'cascade' }),
  connected_at: timestamp().defaultNow(),
});
