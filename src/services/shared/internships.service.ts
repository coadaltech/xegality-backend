import { InferInsertModel, ilike, or, lt, sql, eq } from "drizzle-orm";
import db from "../../config/db";
import {
  applied_internship_model,
  internship_model,
  posted_internship_model,
} from "../../models/shared/internship.model";
import { user_model } from "../../models/shared/user.model";
import { create_unique_id } from "../../utils";

type NewInternship = InferInsertModel<typeof internship_model>;

const get_internships = async () => {
  try {
    const internship_opportunities = await db.select().from(internship_model);

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

const add_internship = async (body: NewInternship, employer_id: number) => {
  try {
    if (!employer_id) {
      return {
        success: false,
        code: 400,
        message: "Missing employer_id",
      };
    }

    const {
      id,
      title,
      location,
      duration,
      compensation_type,
      salary_amount,
      application_deadline,
      description,
      requirements,
      benefits,
      posted_by,
      posted_date = new Date(),
      specialization,
      designation,
    } = body;

    const result = await db
      .insert(internship_model)
      .values({
        id,
        title,
        location,
        duration,
        compensation_type,
        salary_amount,
        application_deadline,
        description,
        requirements,
        benefits,
        posted_by,
        posted_date,
        specialization,
        designation,
      })
      .returning();

    // await db.insert(posted_internship_model).values({
    //   internship_id: id,
    //   lawyer_id: posted_by,
    // });

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
const apply_internship = async (internship_id: number, student_id: number) => {
  try {
    const internship = (
      await db
        .select()
        .from(internship_model)
        .where(eq(internship_model.id, internship_id))
        .limit(1)
    )[0];

    if (!internship) {
      return {
        success: false,
        code: 404,
        message: "No Such Internship",
      };
    }

    // Update user to add internship ID
    await db.insert(applied_internship_model).values({
      student_id: student_id,
      internship_id: internship_id,
    });

    return {
      success: true,
      code: 200,
      message: "Internship applied successfully",
    };
  } catch (error) {
    return {
      success: false,
      code: 500,
      message: "Error in applying internship",
    };
  }
};
const search_internships = async (query: string) => {
  try {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      return {
        success: true,
        code: 200,
        message: "Empty query provided",
        data: [],
      };
    }

    const internships = await db
      .select()
      .from(internship_model)
      .where(
        or(
          ilike(internship_model.title, `%${trimmedQuery}%`),
          ilike(internship_model.location, `%${trimmedQuery}%`)
        )
      );

    return {
      success: true,
      code: 200,
      message:
        internships.length > 0
          ? "Internships found"
          : "No internship opportunities matched the query",
      data: internships,
    };
  } catch (error) {
    console.error("search_internships error:", error);
    return {
      success: false,
      code: 500,
      message: "Failed to search internship opportunities",
      error: String(error),
    };
  }
};

const delete_expired_internships = async () => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const deleted = await db
      .delete(internship_model)
      .where(lt(internship_model.application_deadline, oneDayAgo))
      .returning();

    return {
      success: true,
      code: 200,
      message:
        deleted.length > 0
          ? `${deleted.length} expired internship(s) deleted`
          : "No expired internships found",
      data: deleted,
    };
  } catch (error) {
    console.error("delete_expired_internships error:", error);
    return {
      success: false,
      code: 500,
      message: "Failed to delete expired internships",
      error: String(error),
    };
  }
};

export {
  get_internships,
  add_internship,
  search_internships,
  delete_expired_internships,
  apply_internship,
};
