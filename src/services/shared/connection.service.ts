import db from "../../config/db";
import { user_connections_model } from "../../models/shared/chat.model";
import { get_connected_lawyers } from "../consumer/dashboard.service";

const create_connection = async (from: number, to: number) => {
  try {
    if (from === to) {
      return {
        success: false,
        code: 400,
        message: "Cannot connect to yourself",
      };
    }

    // Check if the connection already exists
    const exists = await get_connected_lawyers(from)
    // check if data exists and if id is in the object of data array
    if (exists.data && exists.data.some((connection) => connection.id === to)) {
      return {
        success: false,
        code: 409,
        message: "Connection already exists",
      };
    }

    await db.insert(user_connections_model).values({ from, to });

    return {
      success: true,
      code: 200,
      message: "Lawyer connection created successfully",
    };
  }
  catch (error) {
    return {
      success: false,
      code: 500,
      message: "ERROR insert lawyer connection",
    };
  }
}

export { create_connection };
