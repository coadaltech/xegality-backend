import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import {
  pgTable,
  bigint,
  integer,
  varchar,
  text,
  serial,
  timestamp,
} from "drizzle-orm/pg-core";
import { user_model } from "../shared/user.model";
import { APPOINTMENT_STATUS_CONST } from "../../types/user.types";

const lawyer_appoinment_model = pgTable("appointments", {
  id: serial().primaryKey(),
  lawyer_id: bigint({ mode: "number" })
    .references(() => user_model.id, { onDelete: "cascade" })
    .notNull(),
  client_name: varchar({ length: 100 }).notNull(),
  client_contact: varchar({ length: 15 }).notNull(),
  appointment_datetime: timestamp().notNull(),
  reason: text().notNull(),
  duration_minutes: integer().notNull(),
  status: varchar({ enum: APPOINTMENT_STATUS_CONST }).notNull(),
});

type AppointmentType = InferSelectModel<typeof lawyer_appoinment_model>;
type InsertAppointmentType = InferInsertModel<typeof lawyer_appoinment_model>;
type UpdateAppointmentType = Partial<Omit<InsertAppointmentType, "id">>;

export { lawyer_appoinment_model };
export type { AppointmentType, InsertAppointmentType, UpdateAppointmentType };
