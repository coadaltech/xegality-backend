import { getTableColumns, Table } from "drizzle-orm";

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

export { omit_table_columns }
