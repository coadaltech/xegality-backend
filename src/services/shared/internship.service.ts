import {
  InferInsertModel,
  ilike,
  or,
  lt,
  sql,
  eq,
  ne,
  and,
  isNull,
} from "drizzle-orm";
import db from "../../config/db";
import {
  applied_internship_model,
  internship_model,
} from "../../models/shared/internship.model";
type NewInternship = InferInsertModel<typeof internship_model>;

export const get_internships = async (id: number, role: string) => {
  try {
    let internship_opportunities;
    if (role === "lawyer" || role === "paralegal") {
      internship_opportunities = await db
        .select()
        .from(internship_model)
        .where(eq(internship_model.posted_by, id));
      if (!internship_opportunities || internship_opportunities.length === 0) {
        return {
          success: true,
          code: 200,
          message: `No Posted Internships Found`,
          data: [],
        };
      }
      return {
        success: true,
        code: 200,
        message: `Total ${internship_opportunities.length} Internships Posted`,
        data: internship_opportunities,
      };

    } else {
      internship_opportunities = await db
        .select()
        .from(internship_model)
        .leftJoin(
          applied_internship_model,
          eq(internship_model.id, applied_internship_model.internship_id)
        )
        .where(
          or(
            isNull(applied_internship_model.student_id),
            ne(applied_internship_model.student_id, id)
          )
        );
      if (!internship_opportunities || internship_opportunities.length === 0) {
        return {
          success: true,
          code: 200,
          message: `No Applied Internships Found`,
          data: [],
        };
      }
      return {
        success: true,
        code: 200,
        message: `Total ${internship_opportunities.length} Internships Available`,
        data: internship_opportunities,
      };
    }
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
export const get_applied_internships = async (id: number) => {
  try {
    const internship_opportunities = await db
      .select()
      .from(internship_model)
      .leftJoin(
        applied_internship_model,
        eq(internship_model.id, applied_internship_model.internship_id)
      )
      .where(eq(applied_internship_model.student_id, id));

    if (!internship_opportunities || internship_opportunities.length === 0) {
      return {
        success: true,
        code: 200,
        message: `Not Applied to Any Internships`,
        data: [],
      };
    }

    return {
      success: true,
      code: 200,
      message: `Total ${internship_opportunities.length} Internships Found`,
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
export const create_internship = async (body: NewInternship) => {
  try {

    const result = await db
      .insert(internship_model)
      .values(body)
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
    if (error?.cause?.code === "23505") {
      return {
        success: false,
        code: 409,
        message: "Duplicate entry: Internship ID or other unique field exists",
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
export const apply_internship = async (internship_id: number, student_id: number) => {
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
export const search_internships = async (query: string) => {
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
export const delete_expired_internships = async () => {
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
