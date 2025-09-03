import db from "@/config/db";
import { student_profile_model, UpdateStudentWithUserType } from "@/models/student/student.model";
import { user_model } from "../../models/shared/user.model";
import { eq, getTableColumns } from "drizzle-orm";
import { undefinedToNull } from "@/utils/ts.utils";

const get_student_profile = async (id: number) => {
  const userColumns = getTableColumns(user_model);
  const studentColumns = getTableColumns(student_profile_model);
  // destructure to drop unwanted ones
  const { id: userId, role, created_at, refresh_token, hashed_password, ...safeUserColumns } = userColumns;
  const { id: studentId, ...safeStudentColumns } = studentColumns;

  try {
    const result = await db
      .select({
        ...safeUserColumns,
        ...safeStudentColumns,
      })
      .from(user_model)
      .leftJoin(student_profile_model, eq(user_model.id, student_profile_model.id))
      .where(eq(user_model.id, id))
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

const update_student_profile = async (id: number, profile: UpdateStudentWithUserType) => {
  try {

    if (profile.name) {
      // name is not part of the student profile, so we don't update it here
      const user_update_result = await db.update(user_model)
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

    const refined_profile = undefinedToNull(profile)
    // Attempt update
    const update_result = await db
      .update(student_profile_model)
      .set({
        gender: refined_profile.gender,
        age: refined_profile.age,
        home_address: refined_profile.home_address,
        languages: refined_profile.languages,
        profile_picture: profile.profile_picture,
        university_name: refined_profile.university_name,
        degree: refined_profile.degree,
        grades: refined_profile.grades,
        passing_year: refined_profile.passing_year,
        practice_area_interests: refined_profile.practice_area_interests,
        prior_internships: refined_profile.prior_internships,
        cv_resume: refined_profile.cv_resume,
        linkedin_url: refined_profile.linkedin_url,
        availability: refined_profile.availability,
        preferred_locations: refined_profile.preferred_locations,
        remote_ok: refined_profile.remote_ok,
      })
      .where(eq(student_profile_model.id, id))
      .returning();

    if (update_result.length > 0) {
      return {
        success: true,
        code: 200,
        message: "Student profile updated successfully",
        data: update_result[0],
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
    console.log("inserting new profile ->", profile)
    const insert_result = await db
      .insert(student_profile_model)
      .values({
        id: id,
        gender: profile.gender,
        age: profile.age,
        home_address: profile.home_address,
        languages: profile.languages,
        profile_picture: profile.profile_picture,
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
      .where(eq(user_model.id, id))

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

export { update_student_profile, get_student_profile }

