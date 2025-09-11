import { pgTable, bigint, serial, varchar, integer, text, json, timestamp, char } from "drizzle-orm/pg-core";
import { user_model } from "../shared/user.model";
import { TimelineEntry } from "../../types/case.types";
import { APPLICATION_STATUS_CONST } from "../../types/ca.types";
import { LEGAL_SERVICES_CONST } from "@/types/ca/applications.types";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

const application_model = pgTable("applications", {
  id: varchar({ length: 50 }).primaryKey(),
  title: varchar({ length: 100 }).notNull(),
  description: text(),
  category: varchar({ enum: LEGAL_SERVICES_CONST }).notNull(),
  status: varchar({ enum: APPLICATION_STATUS_CONST }).default("in_progress"),
  open_date: timestamp({ withTimezone: true }).notNull(),
  handled_by: bigint({ mode: "number" }).references(() => user_model.id, { onDelete: 'cascade' }).notNull(),
  ca_name: varchar({ length: 100 }).notNull(),
  consumer_id: bigint({ mode: "number" }).references(() => user_model.id).notNull(),
  consumer_name: varchar({ length: 50 }).notNull(),
  consumer_phone: bigint({ mode: "number" }).notNull(),
  consumer_age: integer(),
  consumer_address: text(),
  consumer_documents: text().array().default([]),
  timeline: json().$type<TimelineEntry[]>().default([
    {
      id: 1,
      title: "Application Submitted",
      description: "Case is initiated",
    }
  ]),
  updated_at: timestamp().defaultNow(),
});


type ApplicationType = InferSelectModel<typeof application_model>;
type InsertApplicationType = Omit<InferInsertModel<typeof application_model>, 'updated_at'>;
type UpdateApplicationType = Partial<InsertApplicationType>;
type ApplicationTypeWithOptionalConsumer = Omit<InsertApplicationType, "consumer_id"> & {
  consumer_id?: number | null | undefined;
};

export { application_model };
export type { ApplicationType, InsertApplicationType, UpdateApplicationType, ApplicationTypeWithOptionalConsumer };

