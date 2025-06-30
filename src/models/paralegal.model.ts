import { pgTable, bigint } from "drizzle-orm/pg-core";
import { user_model } from "./shared/user.model";

export const paralegal_model = pgTable("paralegals", {
    id: bigint({ mode: "number" })
        .primaryKey()
        .references(() => user_model.id, { onDelete: 'cascade' }),
})