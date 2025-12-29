import db from "@/config/db";
import {
  student_profile_model,
  UpdateStudentWithUserType,
} from "@/models/student/student.model";
import { user_model } from "../../models/shared/user.model";
import { eq, getTableColumns, and } from "drizzle-orm";
import { undefinedToNull } from "@/utils/ts.utils";

const get_student_profile = async (id: number) => {
  const userColumns = getTableColumns(user_model);
  const studentColumns = getTableColumns(student_profile_model);
  // destructure to drop unwanted ones
  const {
    id: userId,
    role,
    created_at,
    refresh_token,
    hashed_password,
    ...safeUserColumns
  } = userColumns;
  const { id: studentId, ...safeStudentColumns } = studentColumns;

  try {
    const result = await db
      .select({
        ...safeUserColumns,
        ...safeStudentColumns,
      })
      .from(user_model)
      .leftJoin(
        student_profile_model,
        eq(user_model.id, student_profile_model.id)
      )
      .where(and(eq(user_model.id, id), eq(user_model.isdeleted, false)))
      .limit(1);

    if (result.length === 0) {
      return {
        success: false,
        code: 404,
        message: "Student profile not found",
      };
    }

    const profile = result[0];

    return {
      success: true,
      code: 200,
      message: "Student profile fetched successfully",
      data: profile,
    };
  } catch (error) {
    return {
      success: false,
      code: 500,
      message: "ERROR get_student_profile",
      error,
    };
  }
};

const update_student_profile = async (
  id: number,
  profile: UpdateStudentWithUserType
) => {
  try {
    if (profile.name) {
      // name is not part of the student profile, so we don't update it here
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

    // Build update object - only include fields that are explicitly provided (not undefined)
    const updateData: any = {};

    // Required fields - always update if provided
    if (
      refined_profile.gender !== undefined &&
      refined_profile.gender !== null
    ) {
      updateData.gender = refined_profile.gender;
    }
    if (refined_profile.age !== undefined && refined_profile.age !== null) {
      updateData.age = refined_profile.age;
    }
    if (
      refined_profile.languages !== undefined &&
      refined_profile.languages !== null
    ) {
      updateData.languages = refined_profile.languages;
    }
    if (
      refined_profile.university_name !== undefined &&
      refined_profile.university_name !== null
    ) {
      updateData.university_name = refined_profile.university_name;
    }
    if (
      refined_profile.practice_area_interests !== undefined &&
      refined_profile.practice_area_interests !== null
    ) {
      updateData.practice_area_interests =
        refined_profile.practice_area_interests;
    }

    // Optional fields - only update if explicitly provided in the request
    if (profile.home_address !== undefined) {
      updateData.home_address = refined_profile.home_address;
    }
    if (profile.profile_picture !== undefined) {
      // If empty string, set to null to clear. Otherwise use the provided value.
      updateData.profile_picture =
        profile.profile_picture && profile.profile_picture.trim() !== ""
          ? profile.profile_picture
          : null;
    }
    if (profile.cover_image !== undefined) {
      // If empty string, set to null to clear. Otherwise use the provided value.
      updateData.cover_image =
        profile.cover_image && profile.cover_image.trim() !== ""
          ? profile.cover_image
          : null;
    }
    if (profile.profile_headline !== undefined) {
      updateData.profile_headline = refined_profile.profile_headline;
    }
    if (profile.bio !== undefined) {
      updateData.bio = refined_profile.bio;
    }
    if (profile.degree !== undefined) {
      updateData.degree = refined_profile.degree;
    }
    if (profile.grades !== undefined) {
      updateData.grades = refined_profile.grades;
    }
    if (profile.passing_year !== undefined) {
      updateData.passing_year = refined_profile.passing_year;
    }
    if (profile.prior_internships !== undefined) {
      updateData.prior_internships = refined_profile.prior_internships;
    }
    if (profile.cv_resume !== undefined) {
      updateData.cv_resume = refined_profile.cv_resume;
    }
    if (profile.linkedin_url !== undefined) {
      updateData.linkedin_url = refined_profile.linkedin_url;
    }
    if (profile.availability !== undefined) {
      updateData.availability = refined_profile.availability;
    }
    if (profile.preferred_locations !== undefined) {
      updateData.preferred_locations = refined_profile.preferred_locations;
    }
    if (profile.remote_ok !== undefined) {
      updateData.remote_ok = refined_profile.remote_ok;
    }

    // Attempt update
    const update_result = await db
      .update(student_profile_model)
      .set(updateData)
      .where(eq(student_profile_model.id, id))
      .returning();

    if (update_result.length > 0) {
      // Fetch and return the full profile (with user data) after update
      const full_profile_result = await get_student_profile(id);

      const response_data = full_profile_result.success
        ? full_profile_result.data
        : update_result[0];

      return {
        success: true,
        code: 200,
        message: "Student profile updated successfully",
        data: response_data,
      };
    }

    // Validate required fields before inserting
    if (
      !profile.gender ||
      !profile.age ||
      !profile.languages ||
      !profile.university_name ||
      !profile.practice_area_interests
    ) {
      return {
        success: false,
        code: 400,
        message: "Failed to create profile, missing All required fields",
      };
    }

    // Insert new student profile
    console.log("inserting new profile ->", profile);
    const insert_result = await db
      .insert(student_profile_model)
      .values({
        id: id,
        gender: profile.gender,
        age: profile.age,
        home_address: profile.home_address,
        languages: profile.languages,
        profile_picture: profile.profile_picture,
        cover_image: profile.cover_image,
        profile_headline: profile.profile_headline,
        bio: profile.bio,
        university_name: profile.university_name,
        degree: profile.degree,
        grades: profile.grades,
        passing_year: profile.passing_year,
        practice_area_interests: profile.practice_area_interests,
        prior_internships: profile.prior_internships,
        cv_resume: profile.cv_resume,
        linkedin_url: profile.linkedin_url,
        availability: profile.availability,
        preferred_locations: profile.preferred_locations,
        remote_ok: profile.remote_ok,
      })
      .returning();

    // Mark user as profile completed
    await db
      .update(user_model)
      .set({ is_profile_complete: true })
      .where(eq(user_model.id, id));

    return {
      success: true,
      code: 201,
      message: "Student profile created successfully",
      data: insert_result[0],
    };
  } catch (error: any) {
    return {
      success: false,
      code: 500,
      message: "ERROR update_student_profile",
      error: error.message,
    };
  }
};

const get_public_student_profile = async (id: number) => {
  const userColumns = getTableColumns(user_model);
  const studentColumns = getTableColumns(student_profile_model);

  // Only expose safe public columns
  const {
    id: userId,
    role,
    created_at,
    refresh_token,
    hashed_password,
    phone,
    email,
    isdeleted,
    is_profile_complete,
    ...safeUserColumns
  } = userColumns;

  const { id: studentId, home_address, ...safeStudentColumns } = studentColumns;

  try {
    const result = await db
      .select({
        ...safeUserColumns,
        ...safeStudentColumns,
      })
      .from(user_model)
      .leftJoin(
        student_profile_model,
        eq(user_model.id, student_profile_model.id)
      )
      .where(
        and(
          eq(user_model.id, id),
          eq(user_model.isdeleted, false),
          eq(user_model.is_profile_complete, true)
        )
      )
      .limit(1);

    if (result.length === 0) {
      return {
        success: false,
        code: 404,
        message: "Student profile not found",
      };
    }

    const profile = result[0];

    return {
      success: true,
      code: 200,
      message: "Student profile fetched successfully",
      data: profile,
    };
  } catch (error) {
    return {
      success: false,
      code: 500,
      message: "ERROR get_public_student_profile",
      error,
    };
  }
};

export {
  update_student_profile,
  get_student_profile,
  get_public_student_profile,
};
