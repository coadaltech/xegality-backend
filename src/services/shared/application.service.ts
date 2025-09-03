import db from "../../config/db";
import { application_model } from "../../models/ca/applications.model";
import { eq } from "drizzle-orm";
import { RoleType } from "../../types/user.types";
import { format_time_spent } from "@/utils/general.utils";

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

export { get_applications_list, get_application_details };
