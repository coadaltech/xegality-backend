import { integer, pgTable, text, timestamp, primaryKey } from "drizzle-orm/pg-core";

const otp_ip_rate_limit_model = pgTable(
  "otp_ip_rate_limits",
  {
    ip: text().notNull(),
    purpose: text().notNull(),
    window_start: timestamp().notNull().defaultNow(),
    count: integer().notNull().default(0),
    banned_until: timestamp(),
    last_attempt: timestamp().notNull().defaultNow(),
    reason: text(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.ip, table.purpose] }),
  })
);

export { otp_ip_rate_limit_model };

