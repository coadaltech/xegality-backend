import db from "../../config/db";
import { application_model, UpdateApplicationType } from "../../models/ca/applications.model";
import { eq } from "drizzle-orm";
import { RoleType } from "../../types/user.types";
import { format_time_spent, format_days_since_date } from "@/utils/general.utils";
import { find_application_by_id } from "../ca/core.service";

const get_applications_list = async (id: number, role: RoleType) => {
  try {
    const db_results =
      await db
        .select({
          title: application_model.title,
          category: application_model.category,
          application_id: application_model.id,
          ca: application_model.handled_by,
          status: application_model.status,
        })
        .from(application_model)
        .where(eq(role === "ca" ? application_model.handled_by : application_model.consumer_id, id))

    if (db_results.length === 0) {
      return {
        success: true,
        code: 404,
        message: "No applications found for this consumer",
        data: [],
      };
    }

    return {
      success: true,
      code: 200,
      message: "applications retrieved successfully",
      data: db_results[0],
    };


  } catch (error) {
    return {
      success: false,
      code: 500,
      message: "ERROR get_all_applications",
    }
  }
}

const get_application_details = async (id: string) => {
  try {
    const db_results = await db.select().from(application_model).where(eq(application_model.id, id));

    if (db_results.length === 0) {
      return {
        success: false,
        code: 404,
        message: "application not found",
      };
    }

    const time_spent = format_time_spent(new Date().getTime() - db_results[0].open_date.getTime());
    const total_documents = db_results[0].consumer_documents?.length;
    const total_activities = db_results[0].timeline?.length;

    return {
      success: true,
      code: 200,
      message: "application details retrieved successfully",
      data: {
        id: db_results[0].id,
        title: db_results[0].title,
        description: db_results[0].description,
        category: db_results[0].category,
        handled_by: db_results[0].handled_by,
        ca_name: db_results[0].ca_name,
        status: db_results[0].status,
        open_date: db_results[0].open_date,
        time_spent,
        consumer_id: db_results[0].consumer_id,
        consumer_name: db_results[0].consumer_name,
        consumer_address: db_results[0].consumer_address,
        consumer_documents: db_results[0].consumer_documents,
        consumer_age: db_results[0].consumer_age,
        consumer_phone: db_results[0].consumer_phone,
        documents: db_results[0].consumer_documents,
        total_documents,
        timeline: db_results[0].timeline,
        total_activities,
        last_activity: db_results[0].updated_at
      }
    }
  }
  catch (error) {
    return {
      success: false,
      code: 500,
      message: "ERROR get_application_details",
    };
  }
}

const update_application = async (body: UpdateApplicationType) => {
  try {
    // Check if the application exists
    if (!body.id) {
      return {
        success: false,
        code: 400,
        message: "Application ID is required for update",
      };
    }

    const existing_application = await find_application_by_id(body.id);
    if (!existing_application.success) {
      return {
        success: false,
        code: 404,
        message: "Application not found with the provided ID",
      };
    }

    // Update the application
    const update_result = await db
      .update(application_model)
      .set({
        title: body.title,
        description: body.description,
        category: body.category,
        status: body.status,
        open_date: body.open_date,
        handled_by: body.handled_by,
        ca_name: body.ca_name,
        consumer_id: body.consumer_id,
        consumer_name: body.consumer_name,
        consumer_phone: body.consumer_phone,
        consumer_age: body.consumer_age,
        consumer_address: body.consumer_address,
        consumer_documents: body.consumer_documents,
        timeline: body.timeline,
        updated_at: new Date(),
      })
      .where(eq(application_model.id, body.id))
      .returning();

    if (update_result.length === 0) {
      return {
        success: false,
        code: 404,
        message: "Failed to update application",
      };
    }

    return {
      success: true,
      code: 200,
      message: "Application updated successfully",
      data: update_result[0],
    };
  } catch (error: any) {
    console.error("Error updating application:", error);

    return {
      success: false,
      code: 500,
      message: "Internal server error while updating application",
      error: error?.message || String(error),
    };
  }
};

export { get_applications_list, get_application_details, update_application };
