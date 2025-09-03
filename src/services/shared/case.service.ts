import { eq } from "drizzle-orm";
import db from "../../config/db";
import { case_model, } from "../../models/shared/case.model";
import { PostCaseType } from "../../types/case.types";
import { RoleType } from "../../types/user.types";
import { format_time_spent } from "@/utils/general.utils";

const get_cases_list = async (id: number, role: RoleType) => {
  try {

    const db_result =
      await db
        .select({
          type: case_model.type,
          title: case_model.title,
          case_id: case_model.id,
          lawyer: case_model.assigned_to,
          status: case_model.status,
        })
        .from(case_model)
        .where(eq(role === "lawyer" ? case_model.assigned_by : case_model.consumer_id, id))

    if (db_result.length === 0) {
      return {
        success: false,
        code: 404,
        message: `No Case Found`,
      };
    }
    return {
      success: true,
      code: 200,
      message: `Total ${db_result.length} Cases Found`,
      data: db_result,
    };
  } catch (error) {
    return {
      success: false,
      code: 500,
      message: "ERROR get_cases",
      error: String(error),
    };
  }
};

const get_case_details = async (case_id: string) => {
  try {
    const db_results = await db.select().from(case_model).where(eq(case_model.id, case_id));

    if (db_results.length === 0) {
      return {
        success: false,
        code: 404,
        message: "Case not found",
      };
    }

    const time_spent = format_time_spent(new Date().getTime() - db_results[0].open_date.getTime());
    const total_documents = db_results[0].consumer_documents?.length;
    const total_activities = db_results[0].timeline?.length;

    return {
      success: true,
      code: 200,
      message: "Case details retrieved successfully",
      data: {
        id: db_results[0].id,
        title: db_results[0].title,
        description: db_results[0].description,
        type: db_results[0].type,
        assigned_to: db_results[0].assigned_to,
        assigned_by: db_results[0].assigned_by,
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
      message: "ERROR get_case_details",
    };
  }
}

const find_case_by_id = async (id: string) => {
  try {
    const case_opportunities = await db.select().from(case_model).where(eq(case_model.id, id))
    if (case_opportunities.length === 0) {
      return {
        success: false,
        code: 404,
        message: `No Case Found`,
      };
    }
    return {
      success: true,
      code: 200,
      message: `Total ${case_opportunities.length} Cases Found`,
      data: case_opportunities[0],
    };
  } catch (error) {
    return {
      success: false,
      code: 500,
      message: "ERROR find_case_by_id",
      error: String(error),
    };
  }
};

export { get_cases_list, get_case_details, find_case_by_id };
