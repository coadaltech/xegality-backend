import db from "../../config/db";
import { student_model } from "../../models/student/student.model";
import { user_model } from "../../models/shared/user.model";
import { eq } from "drizzle-orm";
import { StudentProfileType } from "../../types/student.types";

const update_student_profile = async ({ id, name, gender, age, home_address, current_location, law_school, degree, graduation_year, cgpa, area_of_interest, linked_in_profile, profile_picture }: StudentProfileType) => {
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

    const insert_or_update_student_result =
      await db
        .insert(student_model)
        .values({
          id,
          gender,
          age,
          home_address,
          current_location,
          law_school,
          degree,
          graduation_year,
          cgpa,
          area_of_interest,
          linked_in_profile,
          profile_picture
        })
        .onConflictDoUpdate({
          target: student_model.id,
          set: {
            gender,
            age,
            home_address,
            current_location,
            law_school,
            degree,
            graduation_year,
            cgpa,
            area_of_interest,
            profile_picture
          }
        }).returning();

    if (insert_or_update_student_result.length === 0) {
      return {
        success: false,
        code: 404,
        message: "student profile not found",
      };
    }

    return {
      success: true,
      code: 200,
      message: "student profile updated successfully",
      data: { name: name, ...insert_or_update_student_result[0] },
    }


  } catch (error) {
    return {
      success: false,
      code: 500,
      message: "ERROR update_student_profile",
      error,
    };
  }

}

export { update_student_profile }
