import { user_model } from "@/models/shared/user.model";
import db from "../../config/db"
import { lawyer_profile_model } from "../../models/lawyer/lawyer.model";
import { FiltersType } from "../../types/consumer.types";
import { eq, or, and, arrayContains, gt, gte, lte, ilike, sql, getTableColumns } from "drizzle-orm";

const userColumns = getTableColumns(user_model);
const lawyerColumns = getTableColumns(lawyer_profile_model);
// destructure to drop unwanted ones
const { role, created_at, refresh_token, hashed_password, ...safeUserColumns } = userColumns;
const { id: lawyerId, ...safeLawyerColumns } = lawyerColumns;

const get_random_lawyers = async (limit: number = 10) => {

  try {
    const db_results = await db
      .select({
        ...safeUserColumns,
        ...safeLawyerColumns,
      })
      .from(lawyer_profile_model)
      .leftJoin(user_model, eq(lawyer_profile_model.id, user_model.id))
      .orderBy(sql`random()`)
      .limit(limit);;

    if (db_results.length === 0) {
      return {
        success: true,
        code: 404,
        message: "No lawyers found",
      };
    }

    return {
      success: true,
      code: 200,
      message: "Random lawyers retrieved successfully",
      data: db_results,
    };
  }
  catch (error) {
    return {
      success: false,
      code: 500,
      message: "ERROR get_random_lawyers",
    };
  }
}

const get_filtered_lawyers = async (filters: FiltersType) => {
  try {
    let conditions: any[] = [];

    if (filters.gender) {
      conditions.push(eq(lawyer_profile_model.gender, filters.gender));
    }

    if (filters.experience_range) {
      conditions.push(and(gte(lawyer_profile_model.experience, filters.experience_range[0]), lte(lawyer_profile_model.experience, filters.experience_range[1])));
    }

    if (filters.practice_areas && filters.practice_areas.length > 0) {
      conditions.push(arrayContains(lawyer_profile_model.practice_areas, filters.practice_areas));
    }

    if (filters.practice_location) {
      conditions.push(ilike(lawyer_profile_model.practice_location, `%${filters.practice_location}%`));
    }

    if (filters.languages && filters.languages.length > 0) {
      conditions.push(arrayContains(lawyer_profile_model.languages, filters.languages));
    }

    if (filters.fee_range) {
      conditions.push(and(gte(lawyer_profile_model.fee, filters.fee_range[0]), lte(lawyer_profile_model.fee, filters.fee_range[1])));
    }

    if (filters.fee_type) {
      conditions.push(eq(lawyer_profile_model.fee_type, filters.fee_type));
    }

    if (filters.rating_range) {
      conditions.push(and(gte(lawyer_profile_model.rating, filters.rating_range[0]), lte(lawyer_profile_model.rating, filters.rating_range[1])));
    }

    if (conditions.length > 0) {
      try {

        const db_results = await db
          .select({
            ...safeUserColumns,
            ...safeLawyerColumns,
          })
          .from(lawyer_profile_model)
          .leftJoin(user_model, eq(lawyer_profile_model.id, user_model.id))
          .where(and(...conditions));

        if (db_results.length === 0) {
          return {
            success: true,
            code: 404,
            message: "No lawyers found with the specified filters",
            data: [],
          };
        }

        return {
          success: true,
          code: 200,
          message: "Filtered lawyers retrieved successfully",
          data: db_results,
        };
      }
      catch (error) {
        return {
          success: false,
          code: 500,
          message: "ERROR in query construction for get_filtered_lawyers",
        };
      }
    }
    else {
      return {
        success: false,
        code: 400,
        message: "No filters provided",
      };
    }
  }
  catch (error) {
    return {
      success: false,
      code: 500,
      message: "ERROR get_filtered_lawyers",
    };
  }
}

export { get_random_lawyers, get_filtered_lawyers }

