import { eq, or } from "drizzle-orm";
import db from "../../config/db";
import { user_connections_model } from "../../models/shared/chat.model";
import { case_model } from "../../models/shared/case.model";
import { format_time_spent } from "@/utils/general.utils";
import { application_model } from "../../models/ca/applications.model";
import { user_model } from "@/models/shared/user.model";
import { lawyer_profile_model } from "@/models/lawyer/lawyer.model";
import { find_case_by_id } from "../shared/case.service";

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
      .leftJoin(
        user_model,
        or(
          eq(user_connections_model.from, user_model.id),
          eq(user_connections_model.to, user_model.id)
        )
      )
      .leftJoin(
        lawyer_profile_model,
        or(
          eq(lawyer_profile_model.id, user_model.id),
          eq(lawyer_profile_model.id, user_model.id)
        )
      )
      .where(
        or(
          eq(user_connections_model.from, consumer_id),
          eq(user_connections_model.to, consumer_id)
        )
      );

    // extract only lawyers
    const connected_lawyers = db_results.filter(
      (lawyer) => lawyer.role === "lawyer"
    );

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
  } catch (error) {
    return {
      success: false,
      code: 500,
      message: "ERROR get_connected_lawyers",
    };
  }
};

const delete_case = async (caseId: string, consumer_id: number) => {
  try {
    // Check if the case exists and belongs to the consumer
    const existing_case = await find_case_by_id(caseId);
    if (!existing_case.success) {
      return {
        success: false,
        code: 404,
        message: "Case not found with the provided ID",
      };
    }

    // Verify the case belongs to the requesting consumer
    if (existing_case.data?.consumer_id !== consumer_id) {
      return {
        success: false,
        code: 403,
        message: "You are not authorized to delete this case",
      };
    }

    // Delete the case
    const delete_result = await db
      .delete(case_model)
      .where(eq(case_model.id, caseId))
      .returning();

    if (delete_result.length === 0) {
      return {
        success: false,
        code: 404,
        message: "Failed to delete case",
      };
    }

    return {
      success: true,
      code: 200,
      message: "Case deleted successfully",
      data: delete_result[0],
    };
  } catch (error: any) {
    console.error("Error deleting case:", error);

    return {
      success: false,
      code: 500,
      message: "Internal server error while deleting case",
      error: error?.message || String(error),
    };
  }
};

export { get_connected_lawyers, delete_case };
