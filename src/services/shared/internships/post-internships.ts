import { InferInsertModel } from "drizzle-orm";
import db from "../../../config/db";
import { internship_opportunity_model } from "../../../models/shared/internship.model";

type NewInternship = InferInsertModel<typeof internship_opportunity_model>;

export const add_internship = async (
  body: NewInternship,
  employer_id: string
) => {
  try {

    if (!employer_id) {
      return {
        success: false,
        code: 400,
        message: "Missing employer_id",
      };
    }

    const internship_id = `${Date.now()}${Math.random()
      .toString(36)
      .slice(2, 6)}`;

    const {
      title,
      firm_name,
      location,
      department,
      position_type,
      duration,
      compensation_type,
      salary_amount,
      start_date,
      application_deadline,
      description,
      requirements,
      benefits,
      is_remote = false,
      accepts_international = false,
      provides_housing = false,
      employer_email,
      posted_date = new Date(),
      applicants_till_now = 0,
      views = 0,
      rating = 0,
    } = body;

    const result = await db
      .insert(internship_opportunity_model)
      .values({
        id: internship_id,
        title,
        firm_name,
        location,
        department,
        position_type,
        duration,
        compensation_type,
        salary_amount,
        start_date,
        application_deadline,
        description,
        requirements,
        benefits,
        is_remote,
        accepts_international,
        provides_housing,
        employer_id,
        employer_email,
        posted_date,
        applicants_till_now,
        views,
        rating,
      })
      .returning();

    return {
      success: true,
      code: 201,
      message: "Internship added successfully",
      data: result[0],
    };
  } catch (error: any) {
    console.error("Error adding internship:", error);

    // Customize known error responses
    if (error.code === "23505") {
      return {
        success: false,
        code: 409,
        message: "Duplicate entry: Employer ID or other unique field exists",
      };
    }

    return {
      success: false,
      code: 500,
      message: "Internal server error while adding internship",
      error: error?.message || String(error),
    };
  }
};
