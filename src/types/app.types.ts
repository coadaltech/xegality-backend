import { t } from "elysia";

const PostInternshipSchema = t.Object({
  title: t.String(),
  firm_name: t.String(),
  location: t.String(),
  department: t.String(),
  position_type: t.String(),
  duration: t.String(),
  compensation_type: t.Optional(t.String()),
  salary_amount: t.Optional(t.String()),
  start_date: t.Date(), // Matches `timestamp` from Drizzle
  application_deadline: t.Date(),
  description: t.String(),
  requirements: t.Array(t.String()), // `.array().notNull()` in Drizzle
  benefits: t.Optional(t.Array(t.String())), // Optional array
  is_remote: t.Optional(t.Boolean()), // `.default(false)` in Drizzle
  accepts_international: t.Optional(t.Boolean()),
  provides_housing: t.Optional(t.Boolean()),
  employer_id: t.String(),
  employer_email: t.String(),
  posted_date: t.Optional(t.Date()), // `.defaultNow()` makes it optional
  applicants_till_now: t.Optional(t.Number()), // integer default(0)
  views: t.Optional(t.Number()),
  rating: t.Optional(t.Number()), // real default(0)
});

export { PostInternshipSchema};
