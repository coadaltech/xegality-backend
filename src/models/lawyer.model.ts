import { pgTable, bigint } from "drizzle-orm/pg-core";
import { user_model } from "./shared/user.model";

export const lawyer_model = pgTable("lawyers", {
  id: bigint({ mode: "number" })
    .primaryKey()
    .references(() => user_model.id),
});

