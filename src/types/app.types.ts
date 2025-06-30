import { t } from "elysia";

export const SearchInternshipSchema = t.Object({
  query: t.String(),
});
export const PostInternshipSchema = t.Object({
  title: t.String(),
  description: t.String(),
  location: t.String(),
  specialization: t.String(),
  designation: t.String(),
  duration: t.String(),
  compensation_type: t.Optional(t.String()),
  salary_amount: t.Optional(t.String()),
  application_deadline: t.String(),
  requirements: t.Array(t.String()),
  benefits: t.Array(t.String()),
  posted_date: t.String(),
});
export const PostInternSchema = t.Object({
  name: t.String(),
  email: t.String(),
  phone: t.Number(), // Number with mode "number"
  university: t.String(),
  year: t.String(),
  specialization: t.String(),
  start_date: t.String({ format: "date-time" }), // timestamp
  status: t.String(),
  rating: t.Optional(t.Number()), // real
  avatar: t.String(),
  tasks_completed: t.Integer(),
  hours_worked: t.Integer(),
  performance: t.String(),
  recent_activity: t.String(),
  supervisor: t.String(),
  department: t.String(),
  contract_type: t.String(),
  salary: t.String(),
});
export const PostCaseSchema = t.Object({
  type: t.String(),
  phone: t.Number(),
  assigned_to: t.String(),
  status: t.String(),
  priority: t.String(),
  open_date: t.Date(),
  description: t.String(),
  client_name: t.String(),
  client_address: t.String(),
  client_documents: t.Array(t.String()),
  client_age: t.Number(),
  // timeline: t.String(),
});
export const ApplyInternshipSchema = t.Object({
  internship_id: t.Number(),
});
export type TimelineEntry = {
  id: number;
  title: string;
  description: string;
  startedAt: Date;
  completedAt?: Date;
};
export type PostCaseType = {
  type: string,
  phone: number,
  assigned_to: string,
  status?: string,
  priority?: string,
  open_date: Date,
  description: string,
  client_name: string,
  client_address: string,
  client_documents?: string[],
  client_age: number,
  timeline?: string
}
export const STATUSENUM = ["pending", "active", "closed", "opened"] as const;
export const PRIRORITYENUM = ["normal", "important", "urgent", "emergency"] as const;
export const TAGENUM = [
  "corporate",
  "criminal",
  "family",
  "constitutional",
  "civil",
  "intellectual property",
  "taxation",
  "labor",
  "environmental",
  "cyber",
  "international",
  "banking",
  "media",
  "real estate",
  "human rights",
  "arbitration",
  "immigration",
  "startup",
  "litigation",
  "contract"
] as const;