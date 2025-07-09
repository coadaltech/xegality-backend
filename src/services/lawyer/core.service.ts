import db from "../../config/db";
import { lawyer_model } from "../../models/lawyer/lawyer.model";
import { user_model } from "../../models/shared/user.model";
import { GenderType, LanguagesType, LawyerFeeType, PracticeAreasType } from "../../types/user.types"
import { eq } from "drizzle-orm";

interface LawyerProfile {
  id: number,
  name?: string,
  experience?: number,
  gender?: GenderType,
  bio?: string,
  bar_number?: string,
  practice_area?: PracticeAreasType,
  practice_location?: string,
  practicing_courts?: string[],
  home_address?: string,
  languages?: LanguagesType[],
  fee?: number,
  fee_type?: LawyerFeeType,
  rating?: number,
  profile_picture?: string
}

const update_lawyer_profile = async ({ id, name, experience, gender, bio, bar_number, practice_area, practice_location, practicing_courts, home_address, languages, fee, fee_type, rating, profile_picture }: LawyerProfile) => {
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

    const update_lawyer_result = await db.update(lawyer_model).set({
      experience,
      gender,
      bio,
      bar_number,
      practice_area,
      practice_location,
      practicing_courts,
      home_address,
      languages,
      fee,
      fee_type,
      rating,
      profile_picture
    }).returning()

    if (update_lawyer_result.length === 0) {
      return {
        success: false,
        code: 404,
        message: "User not found",
      };
    }

    return {
      success: true,
      code: 200,
      message: "Lawyer profile updated successfully",
      data: update_lawyer_result[0],
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
