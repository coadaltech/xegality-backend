import db from "@/config/db";
import { application_model, ApplicationType, ApplicationTypeWithOptionalConsumer, InsertApplicationType, UpdateApplicationType } from "@/models/ca/applications.model";
import { eq } from "drizzle-orm";
import { generate_application_id } from "@/utils/general.utils";
import { find_application_by_id } from "./core.service";
import { create_user } from "../shared/user.service";
import { RoleType } from "@/types/user.types";

const get_applications_list = async (id: number, role: RoleType) => {
  try {
    const db_result = await db
      .select({
        id: application_model.id,
        title: application_model.title,
        category: application_model.category,
        ca_name: application_model.ca_name,
        status: application_model.status,
      })
      .from(application_model)
      .where(eq(role === "ca" ? application_model.handled_by : application_model.consumer_id, id))

    if (db_result.length === 0) {
      return {
        success: false,
        code: 404,
        message: `No application Found`,
      };
    }
    return {
      success: true,
      code: 200,
      message: `Total ${db_result.length} applications Found`,
      data: db_result,
    };
  } catch (error) {
    return {
      success: false,
      code: 500,
      message: "ERROR get_applications",
      error: String(error),
    };
  }
}

const create_new_application = async (body: InsertApplicationType, handled_by: number) => {
  try {
    let application_id;
    do { application_id = generate_application_id() } while ((await find_application_by_id(application_id)).success);

    // Create a new user if consumer_id is not provided
    if (!body.consumer_id) {
      const create_user_result = await create_user(body.consumer_name, `${body.consumer_phone}`, "consumer", body.consumer_phone)
      if (!create_user_result.success || !create_user_result.data) {
        return {
          success: false,
          code: create_user_result.code,
          message: `ERROR create_application -> ${create_user_result.message}`,
        };
      }

      // fetch the created user ID
      body.consumer_id = create_user_result.data.user_id;
    }

    const result = await db
      .insert(application_model)
      .values({
        id: application_id,
        title: body.title,
        description: body.description,
        category: body.category,
        status: body.status,
        open_date: body.open_date,
        handled_by: handled_by,
        ca_name: body.ca_name,
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
      message: "application successfully created",
      data: result[0],
    };
  } catch (error: any) {
    console.error("Error adding application:", error);

    // Customize known error responses
    if (error?.cause?.code === "23505") {
      return {
        success: false,
        code: 409,
        message: "Duplicate entry: application ID or other unique field exists",
      };
    }

    return {
      success: false,
      code: 500,
      message: "Internal server error while creating new application",
      error: error?.message || String(error),
    };
  }
};


const update_application = async (body: UpdateApplicationType) => {
  try {
    if (!body.id) {
      return {
        success: false,
        code: 400,
        message: "ERROR update_application -> Missing application ID",
      };
    }

    // Check if the application exists
    const existing_application = await find_application_by_id(body.id);
    if (!existing_application.success) {
      return {
        success: false,
        code: 404,
        message: "Application not found",
      };
    }

    // Update the application
    const result = await db
      .update(application_model)
      .set(body)
      .where(eq(application_model.id, body.id))
      .returning();

    return {
      success: true,
      code: 200,
      message: "Application successfully updated",
      data: result[0],
    };
  } catch (error: any) {
    console.error("Error updating application:", error);
    return {
      success: false,
      code: 500,
      message: "ERROR update_application -> Internal server error",
      error: error?.message || String(error),
    };
  }
}

export { get_applications_list, create_new_application, update_application }

