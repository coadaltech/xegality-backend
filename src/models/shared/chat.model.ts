import {
  integer,
  pgTable,
  serial,
  text,
  varchar,
  boolean,
  timestamp,
  bigint,
} from "drizzle-orm/pg-core";
import { user_model } from "./user.model";
import { media_model } from "./docs.model";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

// Message table definition
const messages_model = pgTable("messages", {
  id: serial().primaryKey(),
  from: bigint({ mode: "number" })
    .references(() => user_model.id, { onDelete: "cascade" })
    .notNull(),
  to: bigint({ mode: "number" })
    .references(() => user_model.id, { onDelete: "cascade" })
    .notNull(),
  content: text(),
  media_id: bigint({ mode: "number" }).references(() => media_model.id, {
    onDelete: "set null",
  }),
  seen: boolean().default(false),
  seen_at: timestamp(), // Timestamp when message was marked as read
  created_at: timestamp().defaultNow(),
});

const user_connections_model = pgTable("connections", {
  id: serial().primaryKey(),
  from: bigint({ mode: "number" }).references(() => user_model.id, {
    onDelete: "cascade",
  }),
  to: bigint({ mode: "number" }).references(() => user_model.id, {
    onDelete: "cascade",
  }),
  connected_at: timestamp().defaultNow(),
});

type MessageType = InferSelectModel<typeof messages_model>;
type InsertMessageType = InferInsertModel<typeof messages_model>;
type UpdateMessageType = Partial<Omit<InsertMessageType, "id">>;

type UserConnectionType = InferSelectModel<typeof user_connections_model>;
type InsertUserConnectionType = InferInsertModel<typeof user_connections_model>;
type UpdateUserConnectionType = Partial<Omit<InsertUserConnectionType, "id">>;

export { messages_model, user_connections_model };
export type {
  MessageType,
  InsertMessageType,
  UpdateMessageType,
  UserConnectionType,
  InsertUserConnectionType,
  UpdateUserConnectionType,
};
