import db from "../../config/db";
import { eq } from "drizzle-orm";
import { user_model } from "../../models/shared/user.model";

export const upgrade_student_to_paralegal = async (student_id: number) => {
  try {
    const result = await db
      .update(user_model)
      .set({
        role: "paralegal",
      })
      .where(eq(user_model.id, student_id))
      .returning();

    if (result.length === 0) {
      return {
        success: false,
        code: 404,
        message: "Student not found",
      };
    }

    return {
      success: true,
      code: 200,
      message: "Student successfully upgraded to paralegal",
      data: result[0],
    };
  } catch (error: any) {
    console.error("Error upgrading student to paralegal:", error);

    return {
      success: false,
      code: 500,
      message: "Internal server error while upgrading student",
      error: error?.message || String(error),
    };
  }
};

export const get_paralegals_under_lawyer = async (lawyer_id: number) => {
  try {
    // This would need a relationship table to track which paralegals work under which lawyer
    // For now, we'll return all paralegals
    const paralegals = await db
      .select()
      .from(user_model)
      .where(eq(user_model.role, "paralegal"));

    return {
      success: true,
      code: 200,
      message: `Found ${paralegals.length} paralegals`,
      data: paralegals,
    };
  } catch (error: any) {
    console.error("Error fetching paralegals:", error);

    return {
      success: false,
      code: 500,
      message: "Internal server error while fetching paralegals",
      error: error?.message || String(error),
    };
  }
};
