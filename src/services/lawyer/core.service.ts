import db from "../../config/db";
import { lawyer_model } from "../../models/lawyer/lawyer.model";
import { user_model } from "../../models/shared/user.model";
import { LawyerProfileType } from "../../types/lawyer.types";
import { eq } from "drizzle-orm";

const update_lawyer_profile = async ({ id, name, experience, gender, age, bio, bar_number, bar_state, practice_area, practice_location, practicing_courts, home_address, languages, fee, fee_type, rating, profile_picture }: LawyerProfileType) => {
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

    const insert_or_update_lawyer_result =
      await db
        .insert(lawyer_model)
        .values({
          id,
          experience,
          gender,
          age,
          bio,
          bar_number,
          bar_state,
          practice_area,
          practice_location,
          practicing_courts,
          home_address,
          languages,
          fee,
          fee_type,
          rating,
          profile_picture
        })
        .onConflictDoUpdate({
          target: lawyer_model.id,
          set: {
            experience,
            gender,
            age,
            bio,
            bar_number,
            bar_state,
            practice_area,
            practice_location,
            practicing_courts,
            home_address,
            languages,
            fee,
            fee_type,
            rating,
            profile_picture
          }
        }).returning();

    if (insert_or_update_lawyer_result.length === 0) {
      return {
        success: false,
        code: 404,
        message: "Lawyer profile not found",
      };
    }

    return {
      success: true,
      code: 200,
      message: "Lawyer profile updated successfully",
      data: { name: name, ...insert_or_update_lawyer_result[0] },
    }


  } catch (error) {
    return {
      success: false,
      code: 500,
      message: "ERROR update_lawyer_profile",
      error,
    };
  }

}

export { update_lawyer_profile }
