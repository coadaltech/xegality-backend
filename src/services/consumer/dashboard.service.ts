import { eq, or } from "drizzle-orm";
import db from "../../config/db"
import { user_connections_model } from "../../models/shared/chat.model"
import { case_model } from "../../models/shared/case.model";
import { format_time_spent } from "@/utils/general.utils";
import { application_model } from "../../models/ca/applications.model";
import { user_model } from "@/models/shared/user.model";
import { lawyer_profile_model } from "@/models/lawyer/lawyer.model";

const get_connected_lawyers = async (consumer_id: number) => {
  try {
    const db_results = await db
      .select({
        id: user_model.id,
        name: user_model.name,
        profile_pic: lawyer_profile_model.profile_picture,
        role: user_model.role,
        // law_firm: lawyer_profile_model.law_firm,
      })
      .from(user_connections_model)
      .leftJoin(user_model, or(
        eq(user_connections_model.from, user_model.id),
        eq(user_connections_model.to, user_model.id)
      ))
      .leftJoin(lawyer_profile_model, or(
        eq(lawyer_profile_model.id, user_model.id),
        eq(lawyer_profile_model.id, user_model.id)
      ))
      .where(
        or(
          eq(user_connections_model.from, consumer_id),
          eq(user_connections_model.to, consumer_id)
        ))

    // extract only lawyers
    const connected_lawyers = db_results.filter(lawyer => lawyer.role === "lawyer");

    if (db_results.length === 0) {
      return {
        success: true,
        code: 404,
        message: "No connected lawyers found",
        data: [],
      };
    }

    return {
      success: true,
      code: 200,
      message: "Connected lawyers retrieved successfully",
      data: connected_lawyers,
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
