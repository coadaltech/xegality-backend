import { integer, pgTable, serial, text, varchar, boolean, timestamp, bigint } from 'drizzle-orm/pg-core';
import { user_model } from './user.model';
import { media_model } from './docs.model';

// Message table definition
export const messages_model = pgTable('messages', {
  id: serial().primaryKey(),
  from: bigint({ mode: "number" }).references(() => user_model.id, { onDelete: 'cascade' }),
  to: bigint({ mode: "number" }).references(() => user_model.id, { onDelete: 'cascade' }),
  content: text(),
  media_id: bigint({ mode: "number" }).references(() => media_model.id, { onDelete: 'set null' }),
  seen: boolean().default(false),
  created_at: timestamp().defaultNow(),
});

export const user_connections_model = pgTable('connections', {
  id: serial().primaryKey(),
  from: bigint({ mode: "number" }).references(() => user_model.id, { onDelete: 'cascade' }),
  to: bigint({ mode: "number" }).references(() => user_model.id, { onDelete: 'cascade' }),
  connected_at: timestamp().defaultNow(),
});
