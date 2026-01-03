import { t } from "elysia";
import { PRACTICE_AREAS_CONST } from "../user.types";

const JOB_TYPE_CONST = ["full_time", "part_time", "internship", "contract", "temporary", "freelance"] as const;
const JOB_APPLICATION_STATUS_CONST = ["applied", "reviewed", "interviewed", "selected", "rejected"] as const;

type JobType = typeof JOB_TYPE_CONST[number];
type JobApplicationStatusType = typeof JOB_APPLICATION_STATUS_CONST[number];

const SearchJobSchema = t.Object({
  query: t.String(),
});

const JobSchema = t.Object({
  title: t.Optional(t.String()),
  law_firm: t.Optional(t.String()),
  description: t.Optional(t.String()),
  responsibilities: t.Optional(t.Array(t.String())),
  location: t.Optional(t.String()),
  domain: t.Optional(t.Array(t.Enum(Object.fromEntries(PRACTICE_AREAS_CONST.map(x => [x, x]))))),
  designation: t.Optional(t.String()),
  type: t.Optional(t.Array(t.Enum(Object.fromEntries(JOB_TYPE_CONST.map(x => [x, x]))))),
  is_remote: t.Optional(t.Boolean()),
  required_experience: t.Optional(t.String()),
  required_education: t.Optional(t.String()),
  salary_pay: t.Optional(t.String()),
  compensation_type: t.Optional(t.String()),
  duration: t.Optional(t.String()),
  application_deadline: t.Optional(t.Date()),
  required_skills: t.Optional(t.Array(t.String())),
  benefits: t.Optional(t.Array(t.String())),
});

const ApplyJobSchema = t.Object({
  job_id: t.Number(),
});

export {
  JOB_TYPE_CONST,
  JOB_APPLICATION_STATUS_CONST,
  SearchJobSchema,
  JobSchema,
  ApplyJobSchema
}
export type {
  JobType,
  JobApplicationStatusType
};

