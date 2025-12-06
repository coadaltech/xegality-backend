import db from "@/config/db";
import {
  lawyer_profile_model,
  UpdateLawyerWithUserType,
} from "../../models/lawyer/lawyer.model";
import { user_model } from "../../models/shared/user.model";
import { eq, getTableColumns } from "drizzle-orm";
import { undefinedToNull } from "@/utils/ts.utils";

const get_lawyer_profile = async (id: number) => {
  const userColumns = getTableColumns(user_model);
  const lawyerColumns = getTableColumns(lawyer_profile_model);
  // destructure to drop unwanted ones
  const {
    id: userId,
    role,
    created_at,
    refresh_token,
    hashed_password,
    ...safeUserColumns
  } = userColumns;
  const { id: lawyerId, ...safeLawyerColumns } = lawyerColumns;

  try {
    const result = await db
      .select({
        ...safeUserColumns,
        ...safeLawyerColumns,
      })
      .from(user_model)
      .leftJoin(
        lawyer_profile_model,
        eq(user_model.id, lawyer_profile_model.id)
      )
      .where(eq(user_model.id, id))
      .limit(1);

    if (result.length === 0) {
      return {
        success: false,
        code: 404,
        message: "Lawyer profile not found",
      };
    }

    const profile = result[0];

    return {
      success: true,
      code: 200,
      message: "Lawyer profile fetched successfully",
      data: profile,
    };
  } catch (error) {
    return {
      success: false,
      code: 500,
      message: "ERROR get_lawyer_profile",
      error,
    };
  }
};

const update_profile_picture = async (
  id: number,
  profile_picture: string
) => {
  try {
    const update_result = await db
      .update(lawyer_profile_model)
      .set({ profile_picture })
      .where(eq(lawyer_profile_model.id, id))
      .returning();

    if (update_result.length > 0) {
      const updated_profile = await get_lawyer_profile(id);
      return {
        success: true,
        code: 200,
        message: "Profile picture updated successfully",
        data: updated_profile.data,
      };
    }

    return {
      success: false,
      code: 404,
      message: "Profile not found. Please complete your profile first.",
    };
  } catch (error: any) {
    return {
      success: false,
      code: 500,
      message: "ERROR update_profile_picture",
      error: error.message,
    };
  }
};

const update_lawyer_profile = async (
  id: number,
  profile: UpdateLawyerWithUserType
) => {
  try {
    if (profile.name) {
      // name is not part of the lawyer profile, so we don't update it here
      const user_update_result = await db
        .update(user_model)
        .set({ name: profile.name })
        .where(eq(user_model.id, id))
        .returning();

      if (user_update_result.length === 0) {
        return {
          success: false,
          code: 404,
          message: "Could not update user name, user not found",
        };
      }
    }

    const refined_profile = undefinedToNull(profile);
    // Attempt update
    const update_result = await db
      .update(lawyer_profile_model)
      .set({
        experience: refined_profile.experience,
        gender: refined_profile.gender,
        age: refined_profile.age,
        bio: refined_profile.bio,
        bar_number: refined_profile.bar_number,
        practice_areas: refined_profile.practice_areas,
        practice_location: refined_profile.practice_location,
        practicing_courts: refined_profile.practicing_courts,
        home_address: refined_profile.home_address,
        languages: refined_profile.languages,
        fee: refined_profile.fee,
        fee_type: refined_profile.fee_type,
        rating: refined_profile.rating,
        profile_picture: profile.profile_picture,
      })
      .where(eq(lawyer_profile_model.id, id))
      .returning();

    if (update_result.length > 0) {
      const updated_profile = await get_lawyer_profile(id);
      return {
        success: true,
        code: 200,
        message: "Lawyer profile updated successfully",
        data: updated_profile.data,
      };
    }

    // Validate required fields before inserting
    if (
      !profile.experience ||
      !profile.gender ||
      !profile.age ||
      !profile.bio ||
      !profile.bar_number ||
      !profile.practice_areas ||
      !profile.practice_location ||
      !profile.languages ||
      !profile.fee_type
    ) {
      return {
        success: false,
        code: 400,
        message: "Failed to create profile, missing All required fields",
      };
    }

    // Insert new lawyer profile
    const insert_result = await db
      .insert(lawyer_profile_model)
      .values({
        id: id,
        experience: profile.experience,
        gender: profile.gender,
        age: profile.age,
        bio: profile.bio,
        bar_number: profile.bar_number,
        practice_areas: profile.practice_areas,
        practice_location: profile.practice_location,
        practicing_courts: profile.practicing_courts,
        home_address: profile.home_address,
        languages: profile.languages,
        fee: profile.fee,
        fee_type: profile.fee_type,
        rating: profile.rating,
        profile_picture: profile.profile_picture,
      })
      .returning();

    // Mark user as profile completed
    await db
      .update(user_model)
      .set({ is_profile_complete: true })
      .where(eq(user_model.id, id));

    const created_profile = await get_lawyer_profile(id);
    return {
      success: true,
      code: 201,
      message: "Lawyer profile created successfully",
      data: created_profile.data,
    };
  } catch (error: any) {
    return {
      success: false,
      code: 500,
      message: "ERROR update_lawyer_profile",
      error: error.message,
    };
  }
};

export { update_lawyer_profile, get_lawyer_profile, update_profile_picture };
