import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { pgTable, bigint, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { user_model } from "../shared/user.model";

const ai_chat_session_model = pgTable("ai_chat_sessions", {
  id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  user_id: bigint({ mode: "number" })
    .notNull()
    .references(() => user_model.id, { onDelete: "cascade" }),
  title: varchar({ length: 255 }),
  created_at: timestamp().notNull().defaultNow(),
  updated_at: timestamp().notNull().defaultNow(),
});

const ai_chat_message_model = pgTable("ai_chat_messages", {
  id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  session_id: bigint({ mode: "number" })
    .notNull()
    .references(() => ai_chat_session_model.id, { onDelete: "cascade" }),
  message: text().notNull(),
  sender: varchar({ length: 10, enum: ["user", "ai"] }).notNull(),
  type: varchar({ length: 20, enum: ["text", "suggestion", "image"] }).default(
    "text"
  ),
  timestamp: timestamp().notNull().defaultNow(),
});

type AIChatSessionType = InferSelectModel<typeof ai_chat_session_model>;
type InsertAIChatSessionType = InferInsertModel<typeof ai_chat_session_model>;
type AIChatMessageType = InferSelectModel<typeof ai_chat_message_model>;
type InsertAIChatMessageType = InferInsertModel<typeof ai_chat_message_model>;

export { ai_chat_session_model, ai_chat_message_model };
export type {
  AIChatSessionType,
  InsertAIChatSessionType,
  AIChatMessageType,
  InsertAIChatMessageType,
};
