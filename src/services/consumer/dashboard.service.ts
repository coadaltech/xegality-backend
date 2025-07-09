import { eq, or } from "drizzle-orm";
import db from "../../config/db"
import { user_connections_model } from "../../models/shared/chat.model"
import { case_model } from "../../models/shared/case.model";
import { format_time_spent } from "../../utils";
import { application_model } from "../../models/ca/applications.model";

const get_connected_lawyers = async (consumer_id: number) => {
  try {
    const db_results = await db.select().from(user_connections_model).where(or(
      eq(user_connections_model.from, consumer_id),
      eq(user_connections_model.to, consumer_id)
    ))

    if (db_results.length === 0) {
      return {
        success: true,
        code: 404,
        message: "No connected lawyers found",
        data: [],
      };
    }

    const lawyers_id = db_results.map(row => {
      return row.from === consumer_id ? row.to : row.from;
    });

    return {
      success: true,
      code: 200,
      message: "Connected lawyers retrieved successfully",
      data: lawyers_id,
    };

  }
  catch (error) {
    return {
      success: false,
      code: 500,
      message: "ERROR get_connected_lawyers",
    };
  }
}

export { get_connected_lawyers };
