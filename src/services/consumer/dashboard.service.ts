import { eq, or } from "drizzle-orm";
import db from "../../config/db"
import { user_connections_model } from "../../models/shared/chat.model"

const get_connected_lawyers = async (consumer_id: number) => {
  try {
    const db_results = await db.select().from(user_connections_model).where(or(
      eq(user_connections_model.user1_id, consumer_id),
      eq(user_connections_model.user2_id, consumer_id)
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
      return row.user1_id === consumer_id ? row.user2_id : row.user1_id;
    });

    console.log("lawyers_id", lawyers_id)

  }
  catch (error) {
    return {
      success: false,
      code: 500,
      message: "ERROR get_connected_lawyers",
      data: null,
    };
  }
}

export { get_connected_lawyers }
