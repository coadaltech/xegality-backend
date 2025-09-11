import { consumer_profile_model } from "@/models/consumer/consumer.model";
import { lawyer_profile_model } from "@/models/lawyer/lawyer.model";
import { student_profile_model } from "@/models/student/student.model";
import { RoleType } from "@/types/user.types";
import { getTableColumns, Table } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";

// generic omit helper
const omit_table_columns = <T extends Table>(
  model: T,
  keys: (keyof ReturnType<typeof getTableColumns<T>>)[]
) => {
  const columns = { ...getTableColumns(model) };
  for (const key of keys as string[]) {
    delete columns[key];
  }
  return columns;
}

const role_profile_models: Record<RoleType, PgTable> = {
  consumer: consumer_profile_model,
  lawyer: lawyer_profile_model,
  student: student_profile_model,
  // --------------------------------------
  // change these when models are created
  // --------------------------------------
  paralegal: consumer_profile_model,
  ca: consumer_profile_model,
  admin: consumer_profile_model,
  // --------------------------------------
  // change these when models are created
  // --------------------------------------
};

function get_profile_model_for_role<R extends RoleType>(role: R) {
  return role_profile_models[role];
}

export {
  omit_table_columns,
  get_profile_model_for_role
}
