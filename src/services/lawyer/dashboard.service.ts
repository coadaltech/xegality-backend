import db from "../../config/db";
import { case_model } from "../../models/shared/case.model";
import { PostCaseType } from "../../types/case.types";
import { generate_case_id } from "@/utils/general.utils";
import { find_case_by_id } from "../shared/case.service";
import { create_user, find_user_by_id } from "../shared/user.service";

export const create_new_case = async (body: PostCaseType, assigned_by_id: number) => {
  try {
    let case_id;
    do { case_id = generate_case_id(body.type || "NA") } while ((await find_case_by_id(case_id)).success);

    // Create a new user if consumer_id is not provided
    if (!body.consumer_id) {
      const create_user_result = await create_user(body.consumer_name, `${body.consumer_phone}`, "consumer", body.consumer_phone)
      if (!create_user_result.success || !create_user_result.data) {
        return {
          success: false,
          code: create_user_result.code,
          message: `ERROR create_case -> ${create_user_result.message}`,
        };
      }

      // fetch the created user ID
      body.consumer_id = create_user_result.data.user_id;
    }
    else {
      // Validate existing consumer_id
      const existing_user = await find_user_by_id(body.consumer_id);
      if (!existing_user.success) {
        return {
          success: false,
          code: 404,
          message: "Consumer not found with the provided ID",
        };
      }
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
        status: body.status,
        priority: body.priority,
        open_date: body.open_date,
        consumer_id: body.consumer_id,
        consumer_name: body.consumer_name,
        consumer_phone: body.consumer_phone,
        consumer_age: body.consumer_age,
        consumer_address: body.consumer_address,
        consumer_documents: body.consumer_documents,
        timeline: body.timeline
      })
      .returning();

    return {
      success: true,
      code: 201,
      message: "case successfully created",
      data: result[0],
    };
  } catch (error: any) {
    console.error("Error adding case:", error);

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
