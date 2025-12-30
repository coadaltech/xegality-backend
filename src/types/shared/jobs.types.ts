import { t } from "elysia";

const JOB_TYPE_CONST = ["full_time", "part_time", "internship", "contract", "temporary", "freelance"] as const;
const JOB_APPLICATION_STATUS_CONST = ["applied", "reviewed", "interviewed", "selected", "rejected"] as const;

type JobType = typeof JOB_TYPE_CONST[number];
type JobApplicationStatusType = typeof JOB_APPLICATION_STATUS_CONST[number];

const SearchJobSchema = t.Object({
  query: t.String(),
});

const PostJobSchema = t.Object({
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

const PostInternSchema = t.Object({
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

const ApplyJobSchema = t.Object({
  job_id: t.Number(),
});

export {
  JOB_TYPE_CONST,
  JOB_APPLICATION_STATUS_CONST,
  SearchJobSchema,
  PostJobSchema,
  PostInternSchema,
  ApplyJobSchema
}
export type {
  JobType,
  JobApplicationStatusType
};

