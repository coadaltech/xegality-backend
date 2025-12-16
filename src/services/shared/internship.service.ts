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
    const result = await db.insert(internship_model).values(body).returning();

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
export const apply_internship = async (
  internship_id: number,
  student_id: number
) => {
  try {
    // Check if internship exists
    console.log("-------------------------------");
    const internship = (
      await db
        .select()
        .from(internship_model)
        .where(eq(internship_model.id, internship_id))
        .limit(1)
    )[0];

    console.log("Internships", internship);

    if (!internship) {
      return {
        success: false,
        code: 404,
        message: "No Such Internship",
      };
    }

    // Check if already applied
    const existingApplication = await db
      .select()
      .from(applied_internship_model)
      .where(
        and(
          eq(applied_internship_model.internship_id, internship_id),
          eq(applied_internship_model.student_id, student_id)
        )
      )
      .limit(1);

    console.log("existing application", existingApplication);

    if (existingApplication.length > 0) {
      return {
        success: false,
        code: 409,
        message: "Already applied to this internship",
      };
    }

    // Apply to internship
    const loda = await db
      .insert(applied_internship_model)
      .values({
        student_id: student_id,
        internship_id: internship_id,
        status: "applied",
      })
      .returning();

    console.log("loda", loda);

    return {
      success: true,
      code: 200,
      message: "Internship applied successfully",
    };
  } catch (error: any) {
    console.error("apply_internship error:", error);
    return {
      success: false,
      code: 500,
      message: "Error in applying internship",
      error: error?.message || String(error),
    };
  }
};
export const update_internship = async (
  internship_id: number,
  lawyer_id: number,
  updateData: Partial<NewInternship>
) => {
  try {
    const result = await db
      .update(internship_model)
      .set({
        ...updateData,
        application_deadline: updateData.application_deadline
          ? new Date(updateData.application_deadline)
          : undefined,
      })
      .where(
        and(
          eq(internship_model.id, internship_id),
          eq(internship_model.posted_by, lawyer_id)
        )
      )
      .returning();

    if (result.length === 0) {
      return {
        success: false,
        code: 404,
        message:
          "Internship not found or you don't have permission to update it",
      };
    }

    return {
      success: true,
      code: 200,
      message: "Internship updated successfully",
      data: result[0],
    };
  } catch (error: any) {
    console.error("Error updating internship:", error);
    return {
      success: false,
      code: 500,
      message: "Internal server error while updating internship",
      error: error?.message || String(error),
    };
  }
};

export const delete_internship = async (
  internship_id: number,
  lawyer_id: number
) => {
  try {
    // First, delete all applications for this internship
    await db
      .delete(applied_internship_model)
      .where(eq(applied_internship_model.internship_id, internship_id));

    // Then delete the internship
    const result = await db
      .delete(internship_model)
      .where(
        and(
          eq(internship_model.id, internship_id),
          eq(internship_model.posted_by, lawyer_id)
        )
      )
      .returning();

    if (result.length === 0) {
      return {
        success: false,
        code: 404,
        message:
          "Internship not found or you don't have permission to delete it",
      };
    }

    return {
      success: true,
      code: 200,
      message: "Internship deleted successfully",
    };
  } catch (error: any) {
    console.error("Error deleting internship:", error);
    return {
      success: false,
      code: 500,
      message: "Internal server error while deleting internship",
      error: error?.message || String(error),
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

export const get_student_internships_by_status = async (
  student_id: number,
  status: string
) => {
  try {
    let internships;

    switch (status) {
      case "all":
        // Get all available internships (not applied by this student)
        internships = await db
          .select()
          .from(internship_model)
          .leftJoin(
            applied_internship_model,
            and(
              eq(internship_model.id, applied_internship_model.internship_id),
              eq(applied_internship_model.student_id, student_id)
            )
          )
          .where(isNull(applied_internship_model.student_id));
        break;

      case "applied":
        // Get internships where student has applied (any status except rejected)
        internships = await db
          .select()
          .from(internship_model)
          .innerJoin(
            applied_internship_model,
            eq(internship_model.id, applied_internship_model.internship_id)
          )
          .where(
            and(
              eq(applied_internship_model.student_id, student_id),
              ne(applied_internship_model.status, "rejected")
            )
          );
        break;

      case "rejected":
        // Get internships where student's application was rejected
        internships = await db
          .select()
          .from(internship_model)
          .innerJoin(
            applied_internship_model,
            eq(internship_model.id, applied_internship_model.internship_id)
          )
          .where(
            and(
              eq(applied_internship_model.student_id, student_id),
              eq(applied_internship_model.status, "rejected")
            )
          );
        break;
      case "selected":
        // Get internships where student's application was rejected
        internships = await db
          .select()
          .from(internship_model)
          .innerJoin(
            applied_internship_model,
            eq(internship_model.id, applied_internship_model.internship_id)
          )
          .where(
            and(
              eq(applied_internship_model.student_id, student_id),
              eq(applied_internship_model.status, "selected")
            )
          );
        break;

      default:
        return {
          success: false,
          code: 400,
          message: "Invalid status. Use 'all', 'applied', or 'rejected'",
        };
    }

    console.log("internships", internships, status);

    return {
      success: true,
      code: 200,
      message: `Found ${internships.length} internships for status: ${status}`,
      data: internships,
    };
  } catch (error) {
    console.error("get_student_internships_by_status error:", error);
    return {
      success: false,
      code: 500,
      message: "Failed to fetch internships by status",
      error: String(error),
    };
  }
};
