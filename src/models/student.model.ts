import { pgTable, bigint } from "drizzle-orm/pg-core";
import { user_model } from "./shared/user.model";

export const student_model = pgTable("students", {
  id: bigint({ mode: "number" })
    .primaryKey()
    .references(() => user_model.id),
});
