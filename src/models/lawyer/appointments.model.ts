import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import {
  pgTable,
  bigint,
  integer,
  varchar,
  text,
  serial,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";
import { user_model } from "../shared/user.model";
import { APPOINTMENT_STATUS_CONST } from "../../types/user.types";

const lawyer_appoinment_model = pgTable("appointments", {
  id: serial().primaryKey(),
  lawyer_id: bigint({ mode: "number" })
    .references(() => user_model.id, { onDelete: "cascade" })
    .notNull(),
  client_name: varchar({ length: 100 }).notNull(),
  client_contact: varchar({ length: 30 }).notNull(),
  appointment_datetime: timestamp().notNull(),
  reason: text().notNull(),
  duration_minutes: integer().notNull(),
  status: varchar({ enum: APPOINTMENT_STATUS_CONST }).notNull(),
  google_calendar_event_id: varchar({ length: 255 }),
  google_calendar_sync_enabled: boolean().default(false),
  google_calendar_sync_status: varchar({ length: 20 }).default("not_synced"), // not_synced, synced, error, pending
});

type AppointmentType = InferSelectModel<typeof lawyer_appoinment_model>;
type InsertAppointmentType = InferInsertModel<typeof lawyer_appoinment_model>;
type UpdateAppointmentType = Partial<Omit<InsertAppointmentType, "id">>;

export { lawyer_appoinment_model };
export type { AppointmentType, InsertAppointmentType, UpdateAppointmentType };
