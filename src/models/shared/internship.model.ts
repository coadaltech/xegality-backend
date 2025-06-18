import {
  pgTable,
  text,
  boolean,
  timestamp,
  integer,
  real,
} from "drizzle-orm/pg-core";

export const internship_opportunity_model = pgTable(
  "internship_opportunities",
  {
    id: text().primaryKey(),
    title: text().notNull(),
    firm_name: text().notNull(),
    location: text().notNull(),
    department: text().notNull(),
    position_type: text().notNull(),
    duration: text().notNull(),
    compensation_type: text(),
    salary_amount: text(),
    start_date: timestamp({ withTimezone: true }).notNull(),
    application_deadline: timestamp({
      withTimezone: true,
    }).notNull(),
    description: text().notNull(),
    requirements: text().array().notNull(),
    benefits: text().array(),
    is_remote: boolean().default(false),
    accepts_international: boolean().default(false),
    provides_housing: boolean().default(false),
    employer_id: text().notNull(),
    employer_email: text().notNull(),
    posted_date: timestamp({ withTimezone: true }).defaultNow(),
    applicants_till_now: integer().default(0),
    views: integer().default(0),
    rating: real().default(0),
  }
);
