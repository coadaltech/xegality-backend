import db from "../../config/db";
import { or } from "drizzle-orm";
import {
  case_model,
  CaseModelType,
  InsertCaseType,
  UpdateCaseType,
} from "../../models/shared/case.model";
import { generate_case_id } from "@/utils/general.utils";
import { find_case_by_id } from "../shared/case.service";
import { create_user, find_user_by_id } from "../shared/user.service";
import { eq, and } from "drizzle-orm";
import { RequiredByKeys, undefinedToNull } from "@/utils/ts.utils";
import { user_model } from "@/models/shared/user.model";
import { consumer_profile_model } from "@/models/consumer/consumer.model";
import { user_connections_model } from "@/models/shared/chat.model";

const create_new_case = async (
  body: UpdateCaseType,
  assigned_by_id: number
) => {
  try {
    let case_id;
    do {
      case_id = generate_case_id(body.type || "NA");
    } while ((await find_case_by_id(case_id)).success);

    // Create a new user if consumer_id is not provided
    let new_account_flag = false;
    if (!body.consumer_id && body.consumer_name) {
      const create_user_result = await create_user(
        body.consumer_name,
        `${body.consumer_phone}`,
        "consumer",
        body.consumer_phone
      );
      if (!create_user_result.success || !create_user_result.data) {
        return {
          success: false,
          code: create_user_result.code,
          message: `ERROR create_case -> ${create_user_result.message}`,
        };
      }

      // fetch the created user ID
      body.consumer_id = create_user_result.data.user_id;
      new_account_flag = true;
    } else {
      // Validate existing consumer_id
      if (!body.consumer_id) {
        return {
          success: false,
          code: 400,
          message: "Either consumer_id or consumer_name must be provided",
        };
      }
      const existing_user = await find_user_by_id(body.consumer_id);
      if (!existing_user.success) {
        return {
          success: false,
          code: 404,
          message: "Consumer not found with the provided ID",
        };
      }
    }

    if (
      !body.consumer_id ||
      !body.consumer_name ||
      !body.title ||
      !body.description ||
      !body.type ||
      !body.assigned_to ||
      !body.open_date ||
      !body.consumer_phone ||
      !body.consumer_age ||
      !body.consumer_address
    ) {
      return {
        success: false,
        code: 400,
        message: "Missing required fields to create a case",
      };
    }

    const result = await db
      .insert(case_model)
      .values({
        id: case_id,
        title: body.title,
        description: body.description,
        type: body.type,
        assigned_to: body.assigned_to,
        assigned_by: assigned_by_id,
        status: body.status || "opened",
        priority: body.priority || "medium",
        open_date: body.open_date,
        consumer_id: body.consumer_id,
        consumer_name: body.consumer_name,
        consumer_phone: body.consumer_phone,
        consumer_age: body.consumer_age,
        consumer_address: body.consumer_address,
        consumer_documents: body.consumer_documents || [],
        timeline: body.timeline || [
          {
            id: 1,
            title: "Case Opened",
            description: "Case is initiated",
          },
        ],
      })
      .returning();

    return {
      success: true,
      code: 201,
      message: "case successfully created",
      data: { ...result[0], new_account: new_account_flag },
    };
  } catch (error: any) {
    // Customize known error responses
    if (error?.cause?.code === "23505") {
      return {
        success: false,
        code: 409,
        message: "Duplicate entry: Case ID or other unique field exists",
      };
    }

    return {
      success: false,
      code: 500,
      message: "Internal server error while creating new case",
      error: error?.message || String(error),
    };
  }
};

const update_case = async (body: UpdateCaseType) => {
  try {
    // Check if the case exists
    if (!body.id) {
      return {
        success: false,
        code: 400,
        message: "Case ID is required for update",
      };
    }

    const existing_case = await find_case_by_id(body.id);
    if (!existing_case.success) {
      return {
        success: false,
        code: 404,
        message: "Case not found with the provided ID",
      };
    }

    // If consumer_id is provided, validate it exists
    if (body.consumer_id) {
      const existing_user = await find_user_by_id(body.consumer_id);
      if (!existing_user.success) {
        return {
          success: false,
          code: 404,
          message: "Consumer not found with the provided ID",
        };
      }
    }

    // Convert undefined values to null
    const refined_body = undefinedToNull(body);

    // Update the case
    const update_result = await db
      .update(case_model)
      .set({
        title: refined_body.title,
        description: refined_body.description,
        type: refined_body.type,
        assigned_to: refined_body.assigned_to,
        status: refined_body.status,
        priority: refined_body.priority,
        open_date: refined_body.open_date,
        consumer_id: refined_body.consumer_id,
        consumer_name: refined_body.consumer_name,
        consumer_phone: refined_body.consumer_phone,
        consumer_age: refined_body.consumer_age,
        consumer_address: refined_body.consumer_address,
        consumer_documents: refined_body.consumer_documents,
        timeline: refined_body.timeline,
        updated_at: new Date(),
      })
      .where(eq(case_model.id, body.id))
      .returning();

    if (update_result.length === 0) {
      return {
        success: false,
        code: 404,
        message: "Failed to update case",
      };
    }

    return {
      success: true,
      code: 200,
      message: "Case updated successfully",
      data: update_result[0],
    };
  } catch (error: any) {
    console.error("Error updating case:", error);

    return {
      success: false,
      code: 500,
      message: "Internal server error while updating case",
      error: error?.message || String(error),
    };
  }
};

const get_connected_consumers = async (consumer_id: number) => {
  try {
    const db_results = await db
      .select({
        id: user_model.id,
        name: user_model.name,
        profile_pic: consumer_profile_model.profile_picture,
        role: user_model.role,
        // law_firm: consumer_profile_model.law_firm,
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
        consumer_profile_model,
        or(
          eq(consumer_profile_model.id, user_model.id),
          eq(consumer_profile_model.id, user_model.id)
        )
      )
      .where(
        or(
          eq(user_connections_model.from, consumer_id),
          eq(user_connections_model.to, consumer_id)
        )
      );

    // extract only consumers
    const connected_consumers = db_results.filter(
      (consumer) => consumer.role === "consumer"
    );

    if (db_results.length === 0) {
      return {
        success: true,
        code: 404,
        message: "No connected consumers found",
        data: [],
      };
    }

    return {
      success: true,
      code: 200,
      message: "Connected consumers retrieved successfully",
      data: connected_consumers,
    };
  } catch (error) {
    return {
      success: false,
      code: 500,
      message: "ERROR get_connected_consumers",
    };
  }
};

const get_cases_history = async (id: number) => {
  try {
    const db_results = await db
      .select()
      .from(case_model)
      .where(
        and(eq(case_model.assigned_by, id), eq(case_model.status, "closed"))
      )
      .orderBy(case_model.updated_at);

    if (db_results.length === 0) {
      return {
        success: true,
        code: 404,
        message: "No closed cases found",
        data: [],
      };
    }

    return {
      success: true,
      code: 200,
      message: "Closed cases retrieved successfully",
      data: db_results,
    };
  } catch (error) {
    return {
      success: false,
      code: 500,
      message: "ERROR get_cases_history",
    };
  }
};

const delete_case = async (caseId: string, lawyer_id: number) => {
  try {
    // Check if the case exists and belongs to the lawyer
    const existing_case = await find_case_by_id(caseId);
    if (!existing_case.success) {
      return {
        success: false,
        code: 404,
        message: "Case not found with the provided ID",
      };
    }

    // Verify the case belongs to the requesting lawyer
    if (existing_case.data?.assigned_by !== lawyer_id) {
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

export {
  create_new_case,
  update_case,
  delete_case,
  get_connected_consumers,
  get_cases_history,
};
