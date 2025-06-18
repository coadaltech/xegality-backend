import db from "../../config/db";
import { internship_opportunity_model } from "../../models/shared/internship.model";
import { InternshipType } from "../../types/app.types";

export const create_internship = async (
  internship: InternshipType,
  id: string,
  role: string
) => {
  try {
    const result = await db
      .insert(internship_opportunity_model)
      .values({
        id: internship.id,
        title: internship.title,
        firm_name: internship.firm_name,
        location: internship.location,
        department: internship.department,
        position_type: internship.position_type,
        duration: internship.duration,
        compensation_type: internship.compensation_type,
        salary_amount: internship.salary_amount,
        start_date: internship.start_date,
        application_deadline: internship.application_deadline,
        description: internship.description,
        requirements: internship.requirements,
        benefits: internship.benefits,
        is_remote: internship.is_remote ?? false,
        accepts_international: internship.accepts_international ?? false,
        provides_housing: internship.provides_housing ?? false,
        employer_id: internship.employer_id,
        employer_email: internship.employer_email,
        posted_date: internship.posted_date ?? new Date(), // optional, defaultNow()
        applicants_till_now: internship.applicants_till_now ?? 0,
        views: internship.views ?? 0,
        rating: internship.rating ?? 0,
      })
      .returning();

    return {
      success: true,
      code: 201,
      message: "Internship opportunity added successfully",
      data: result[0],
    };
  } catch (error) {
    console.error("create_internship error:", error);
    return {
      success: false,
      code: 500,
      message: "Failed to add internship opportunity",
      error: String(error),
    };
  }
};
