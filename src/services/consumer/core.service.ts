import db from "../../config/db"
import { consumer_model } from "../../models/consumer/consumer.model";
import { lawyer_model } from "../../models/lawyer/lawyer.model";
import { user_model } from "../../models/shared/user.model";
import { ConsumerProfileType, FiltersType } from "../../types/consumer.types";
import { eq, or, and, arrayContains, gt, gte, lte } from "drizzle-orm";

const get_filtered_lawyers = async (filters: FiltersType) => {
  try {
    let conditions: any[] = [];

    if (filters.gender) {
      conditions.push(eq(lawyer_model.gender, filters.gender));
    }

    if (filters.experience) {
      conditions.push(eq(lawyer_model.experience, filters.experience));
    }

    if (filters.bar_state) {
      conditions.push(eq(lawyer_model.bar_state, filters.bar_state));
    }

    if (filters.practice_area) {
      conditions.push(eq(lawyer_model.practice_area, filters.practice_area));
    }

    if (filters.practice_location) {
      conditions.push(eq(lawyer_model.practice_location, filters.practice_location));
    }

    if (filters.languages && filters.languages.length > 0) {
      conditions.push(arrayContains(lawyer_model.languages, filters.languages));
    }

    if (filters.fee_range) {
      conditions.push(and(gte(lawyer_model.fee, filters.fee_range[0]), lte(lawyer_model.fee, filters.fee_range[1])));
    }

    if (filters.fee_type) {
      conditions.push(eq(lawyer_model.fee_type, filters.fee_type));
    }

    if (filters.rating) {
      conditions.push(eq(lawyer_model.rating, filters.rating));
    }

    if (conditions.length > 0) {
      try {

        const db_results = await db.select().from(lawyer_model).where(and(...conditions));
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
  }
  catch (error) {
    return {
      success: false,
      code: 500,
      message: "ERROR get_filtered_lawyers",
    };
  }
}

const update_consumer_profile = async ({ id, name, gender, age, employment_status, marital_status, home_address, current_location, profile_picture }: ConsumerProfileType) => {
  try {
    if (name) {
      const update_user_result = await db.update(user_model).set({ name }).where(eq(user_model.id, id)).returning();

      if (update_user_result.length === 0) {
        return {
          success: false,
          code: 404,
          message: "User not found",
        };
      }
    }

    const insert_or_update_consumer_result =
      await db
        .insert(consumer_model)
        .values({
          id,
          gender,
          age,
          employment_status,
          marital_status,
          home_address,
          current_location,
          profile_picture
        })
        .onConflictDoUpdate({
          target: lawyer_model.id,
          set: {
            gender,
            age,
            employment_status,
            marital_status,
            home_address,
            current_location,
            profile_picture
          }
        }).returning();

    if (insert_or_update_consumer_result.length === 0) {
      return {
        success: false,
        code: 404,
        message: "Consumer profile not found",
      };
    }

    return {
      success: true,
      code: 200,
      message: "Consumer profile updated successfully",
      data: { name: name, ...insert_or_update_consumer_result[0] },
    }


  } catch (error) {
    return {
      success: false,
      code: 500,
      message: "ERROR update_consumer_profile",
      error,
    };
  }

}


export { get_filtered_lawyers, update_consumer_profile }
