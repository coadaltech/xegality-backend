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

export const ApplyInternshipSchema = t.Object({
  internship_id: t.Number(),
});

