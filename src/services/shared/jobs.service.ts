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
  applied_jobs_model,
  jobs_model,
  InsertJobType,
  UpdateJobType,
} from "../../models/shared/jobs.model";
import { user_model } from "../../models/shared/user.model";
import { undefinedToNull } from "@/utils/ts.utils";

export const get_jobs = async (id: number, role: string) => {
  try {
    let job_opportunities;
    if (role === "lawyer" || role === "paralegal") {
      // For lawyers, return jobs they posted
      job_opportunities = await db
        .select()
        .from(jobs_model)
        .where(eq(jobs_model.posted_by, id));
      if (!job_opportunities || job_opportunities.length === 0) {
        return {
          success: true,
          code: 200,
          message: `No Posted Jobs Found`,
          data: [],
        };
      }
      return {
        success: true,
        code: 200,
        message: `Total ${job_opportunities.length} Jobs Posted`,
        data: job_opportunities,
      };
    } else {
      // For students and other users, return all available jobs (not applied by them)
      job_opportunities = await db
        .select()
        .from(jobs_model)
        .leftJoin(
          applied_jobs_model,
          and(
            eq(jobs_model.id, applied_jobs_model.job_id),
            eq(applied_jobs_model.applicant_id, id)
          )
        )
        .where(
          or(
            isNull(applied_jobs_model.applicant_id),
            ne(applied_jobs_model.applicant_id, id)
          )
        );
      if (!job_opportunities || job_opportunities.length === 0) {
        return {
          success: true,
          code: 200,
          message: `No Available Jobs Found`,
          data: [],
        };
      }
      return {
        success: true,
        code: 200,
        message: `Total ${job_opportunities.length} Jobs Available`,
        data: job_opportunities,
      };
    }
  } catch (error) {
    console.error("fetch_jobs error:", error);
    return {
      success: false,
      code: 500,
      message: "Failed to fetch job opportunities",
      error: String(error),
    };
  }
};

export const get_all_jobs = async (applicant_id?: number) => {
  try {
    // Get all jobs available, optionally excluding those already applied by applicant_id
    if (applicant_id) {
      const job_opportunities = await db
        .select()
        .from(jobs_model)
        .leftJoin(
          applied_jobs_model,
          and(
            eq(jobs_model.id, applied_jobs_model.job_id),
            eq(applied_jobs_model.applicant_id, applicant_id)
          )
        )
        .where(
          or(
            isNull(applied_jobs_model.applicant_id),
            ne(applied_jobs_model.applicant_id, applicant_id)
          )
        );
      return {
        success: true,
        code: 200,
        message: `Total ${job_opportunities.length} Jobs Available`,
        data: job_opportunities,
      };
    } else {
      const job_opportunities = await db.select().from(jobs_model);
      return {
        success: true,
        code: 200,
        message: `Total ${job_opportunities.length} Jobs Available`,
        data: job_opportunities,
      };
    }
  } catch (error) {
    console.error("get_all_jobs error:", error);
    return {
      success: false,
      code: 500,
      message: "Failed to fetch all jobs",
      error: String(error),
    };
  }
};

export const get_applied_jobs = async (id: number) => {
  try {
    const job_opportunities = await db
      .select()
      .from(jobs_model)
      .innerJoin(
        applied_jobs_model,
        eq(jobs_model.id, applied_jobs_model.job_id)
      )
      .where(eq(applied_jobs_model.applicant_id, id));

    if (!job_opportunities || job_opportunities.length === 0) {
      return {
        success: true,
        code: 200,
        message: `Not Applied to Any Jobs`,
        data: [],
      };
    }

    return {
      success: true,
      code: 200,
      message: `Total ${job_opportunities.length} Jobs Found`,
      data: job_opportunities,
    };
  } catch (error) {
    console.error("fetch_applied_jobs error:", error);
    return {
      success: false,
      code: 500,
      message: "Failed to fetch applied jobs",
      error: String(error),
    };
  }
};

export const create_job = async (body: InsertJobType) => {
  try {
    const result = await db.insert(jobs_model).values(body).returning();

    return {
      success: true,
      code: 201,
      message: "Job posted successfully",
      data: result[0],
    };
  } catch (error: any) {
    console.error("Error creating job:", error);

    // Customize known error responses
    if (error?.cause?.code === "23505") {
      return {
        success: false,
        code: 409,
        message: "Duplicate entry: Job ID or other unique field exists",
      };
    }

    return {
      success: false,
      code: 500,
      message: "Internal server error while creating job",
      error: error?.message || String(error),
    };
  }
};

export const apply_job = async (job_id: number, applicant_id: number) => {
  try {
    // Check if job exists
    const job = (
      await db
        .select()
        .from(jobs_model)
        .where(eq(jobs_model.id, job_id))
        .limit(1)
    )[0];

    if (!job) {
      return {
        success: false,
        code: 404,
        message: "No Such Job",
      };
    }

    // Check if already applied
    const existingApplication = await db
      .select()
      .from(applied_jobs_model)
      .where(
        and(
          eq(applied_jobs_model.job_id, job_id),
          eq(applied_jobs_model.applicant_id, applicant_id)
        )
      )
      .limit(1);

    if (existingApplication.length > 0) {
      return {
        success: false,
        code: 409,
        message: "Already applied to this job",
      };
    }

    // check if user's profile is complete
    const user = await db
      .select({ profile_complete: user_model.is_profile_complete })
      .from(user_model)
      .where(eq(user_model.id, applicant_id))
      .limit(1);

    if (user.length === 0 || !user[0].profile_complete) {
      return {
        success: false,
        code: 400,
        message: "Complete your profile before applying to jobs",
      };
    }

    // Apply to job
    await db.insert(applied_jobs_model).values({
      applicant_id: applicant_id,
      job_id: job_id,
      status: "applied",
    });

    return {
      success: true,
      code: 200,
      message: "Job application submitted successfully",
    };
  } catch (error: any) {
    console.error("apply_job error:", error);
    return {
      success: false,
      code: 500,
      message: "Error in applying to job",
      error: error?.message || String(error),
    };
  }
};

export const update_job = async (
  job_id: number,
  lawyer_id: number,
  updateData: UpdateJobType
) => {
  try {

    const refined_data = undefinedToNull(updateData);

    const result = await db
      .update(jobs_model)
      .set({
        ...refined_data,
        application_deadline: refined_data.application_deadline
          ? new Date(updateData.application_deadline as any)
          : undefined,
      })
      .where(
        and(
          eq(jobs_model.id, job_id),
          eq(jobs_model.posted_by, lawyer_id)
        )
      )
      .returning();

    if (result.length === 0) {
      return {
        success: false,
        code: 404,
        message:
          "Job not found or you don't have permission to update it",
      };
    }

    return {
      success: true,
      code: 200,
      message: "Job updated successfully",
      data: result[0],
    };
  } catch (error: any) {
    console.error("Error updating job:", error);
    return {
      success: false,
      code: 500,
      message: "Internal server error while updating job",
      error: error?.message || String(error),
    };
  }
};

export const delete_job = async (job_id: number, lawyer_id: number) => {
  try {
    // First, delete all applications for this job
    await db
      .delete(applied_jobs_model)
      .where(eq(applied_jobs_model.job_id, job_id));

    // Then delete the job
    const result = await db
      .delete(jobs_model)
      .where(
        and(
          eq(jobs_model.id, job_id),
          eq(jobs_model.posted_by, lawyer_id)
        )
      )
      .returning();

    if (result.length === 0) {
      return {
        success: false,
        code: 404,
        message:
          "Job not found or you don't have permission to delete it",
      };
    }

    return {
      success: true,
      code: 200,
      message: "Job deleted successfully",
    };
  } catch (error: any) {
    console.error("Error deleting job:", error);
    return {
      success: false,
      code: 500,
      message: "Internal server error while deleting job",
      error: error?.message || String(error),
    };
  }
};

export const search_jobs = async (query: string) => {
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

    const jobs = await db
      .select()
      .from(jobs_model)
      .where(
        or(
          ilike(jobs_model.title, `%${trimmedQuery}%`),
          ilike(jobs_model.location, `%${trimmedQuery}%`),
          ilike(jobs_model.description, `%${trimmedQuery}%`)
        )
      );

    return {
      success: true,
      code: 200,
      message:
        jobs.length > 0
          ? "Jobs found"
          : "No job opportunities matched the query",
      data: jobs,
    };
  } catch (error) {
    console.error("search_jobs error:", error);
    return {
      success: false,
      code: 500,
      message: "Failed to search job opportunities",
      error: String(error),
    };
  }
};

export const get_applicant_jobs_by_status = async (
  applicant_id: number,
  status: string
) => {
  try {
    let jobs;

    switch (status) {
      case "all":
        // Get all available jobs (not applied by this applicant)
        jobs = await db
          .select()
          .from(jobs_model)
          .leftJoin(
            applied_jobs_model,
            and(
              eq(jobs_model.id, applied_jobs_model.job_id),
              eq(applied_jobs_model.applicant_id, applicant_id)
            )
          )
          .where(isNull(applied_jobs_model.applicant_id));
        break;

      case "applied":
        // Get jobs where applicant has applied (any status except rejected)
        jobs = await db
          .select()
          .from(jobs_model)
          .innerJoin(
            applied_jobs_model,
            eq(jobs_model.id, applied_jobs_model.job_id)
          )
          .where(
            and(
              eq(applied_jobs_model.applicant_id, applicant_id),
              ne(applied_jobs_model.status, "rejected")
            )
          );
        break;

      case "rejected":
        // Get jobs where applicant's application was rejected
        jobs = await db
          .select()
          .from(jobs_model)
          .innerJoin(
            applied_jobs_model,
            eq(jobs_model.id, applied_jobs_model.job_id)
          )
          .where(
            and(
              eq(applied_jobs_model.applicant_id, applicant_id),
              eq(applied_jobs_model.status, "rejected")
            )
          );
        break;
      case "selected":
        // Get jobs where applicant's application was selected
        jobs = await db
          .select()
          .from(jobs_model)
          .innerJoin(
            applied_jobs_model,
            eq(jobs_model.id, applied_jobs_model.job_id)
          )
          .where(
            and(
              eq(applied_jobs_model.applicant_id, applicant_id),
              eq(applied_jobs_model.status, "selected")
            )
          );
        break;

      default:
        return {
          success: false,
          code: 400,
          message: "Invalid status. Use 'all', 'applied', 'rejected', or 'selected'",
        };
    }

    return {
      success: true,
      code: 200,
      message: `Found ${jobs.length} jobs for status: ${status}`,
      data: jobs,
    };
  } catch (error) {
    console.error("get_applicant_jobs_by_status error:", error);
    return {
      success: false,
      code: 500,
      message: "Failed to fetch jobs by status",
      error: String(error),
    };
  }
};

