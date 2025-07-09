import db from "../../config/db";
import { application_model } from "../../models/ca/applications.model";
import { eq } from "drizzle-orm";


const find_application_by_id = async (id: string) => {
  try {
    const db_results = await db.select().from(application_model).where(eq(application_model.id, id))
    if (db_results.length === 0) {
      return {
        success: false,
        code: 404,
        message: `No application Found`,
      };
    }
    return {
      success: true,
      code: 200,
      message: `Total ${db_results.length} applications Found`,
      data: db_results[0],
    };
  } catch (error) {
    return {
      success: false,
      code: 500,
      message: "ERROR find_application_by_id",
      error: String(error),
    };
  }
};

export { find_application_by_id };
