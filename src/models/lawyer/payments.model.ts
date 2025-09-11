import { InferSelectModel, InferInsertModel, sql } from "drizzle-orm";
import { pgTable, bigint, integer, varchar, char, text, jsonb, check, timestamp, date } from "drizzle-orm/pg-core";
import { user_model } from "../shared/user.model";
import { LANGUAGES_CONST, LAWYER_FEE_CONST, GENDER_CONST, PRACTICE_AREAS_CONST, PAYMENT_STATUS_CONST } from "../../types/user.types";
import { case_model } from "../shared/case.model";

const lawyer_invoice_model = pgTable("lawyer_invoice", {
  invoice_number: varchar({ length: 15 }).primaryKey(),
  issuer_id: bigint({ mode: "number" }).references(() => user_model.id, { onDelete: 'cascade' }).notNull(),
  client_id: bigint({ mode: "number" }).references(() => user_model.id, { onDelete: 'set null' }),
  client_name: varchar({ length: 50 }).notNull(),
  client_phone: varchar({ length: 15 }),
  client_email: varchar({ length: 50 }),
  case_reference: varchar({ length: 30 }).references(() => case_model.id, { onDelete: 'set null' }),
  description: text().notNull(),
  date_issued: date({ mode: "date" }).notNull(),
  items: jsonb().notNull(),
  total_amount: integer().notNull(),
  status: varchar({ enum: PAYMENT_STATUS_CONST }).notNull(),
  note: text(),
},
  (table) => [
    check(
      "at_least_one_contact",
      sql`(${table.client_phone} IS NOT NULL OR ${table.client_email} IS NOT NULL)`)
  ]
)

type LawyerInvoiceType = InferSelectModel<typeof lawyer_invoice_model>
type InsertLawyerInvoiceType = InferInsertModel<typeof lawyer_invoice_model>
type UpdateLawyerInvoiceType = Partial<InsertLawyerInvoiceType>;

export { lawyer_invoice_model };
export type { LawyerInvoiceType, InsertLawyerInvoiceType, UpdateLawyerInvoiceType };
