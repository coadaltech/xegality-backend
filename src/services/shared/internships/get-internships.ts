import db from "../../../config/db";
import { internship_opportunity_model } from "../../../models/shared/internship.model";


export const get_internships = async () => {
  try {
    const internship_opportunities = await db
      .select()
      .from(internship_opportunity_model);

    if (!internship_opportunities || internship_opportunities.length === 0) {
      return {
        success: true,
        code: 200,
        message: "No internship opportunities found",
        data: [],
      };
    }

    return {
      success: true,
      code: 200,
      message: "Internship opportunities fetched successfully",
      data: internship_opportunities,
    };
  } catch (error) {
    console.error("fetch_internships error:", error);
    return {
      success: false,
      code: 500,
      message: "Failed to fetch internship opportunities",
      error: String(error),
    };
  }
};
