import db from "../../config/db";
import { eq, and } from "drizzle-orm";
import { applied_jobs_model, jobs_model } from "../../models/shared/jobs.model";
import { user_model } from "../../models/shared/user.model";
import { student_profile_model } from "../../models/student/student.model";
import { lawyer_profile_model } from "../../models/lawyer/lawyer.model";
import { JobApplicationStatusType } from "@/types/shared/jobs.types";

export const get_job_applications = async (lawyer_id: number) => {
  try {
    const applications = await db
      .select({
        application_id: applied_jobs_model.id,
        job_id: applied_jobs_model.job_id,
        applicant_id: applied_jobs_model.applicant_id,
        applied_at: applied_jobs_model.applied_at,
        status: applied_jobs_model.status,
        notes: applied_jobs_model.notes,
        interview_scheduled: applied_jobs_model.interview_scheduled,
        interview_notes: applied_jobs_model.interview_notes,
        job: {
          id: jobs_model.id,
          title: jobs_model.title,
          law_firm: jobs_model.law_firm,
          description: jobs_model.description,
          responsibilities: jobs_model.responsibilities,
          location: jobs_model.location,
          domain: jobs_model.domain,
          designation: jobs_model.designation,
          type: jobs_model.type,
          required_experience: jobs_model.required_experience,
          required_education: jobs_model.required_education,
          salary_pay: jobs_model.salary_pay,
          compensation_type: jobs_model.compensation_type,
          duration: jobs_model.duration,
          application_deadline: jobs_model.application_deadline,
          required_skills: jobs_model.required_skills,
          benefits: jobs_model.benefits,
          posted_by: jobs_model.posted_by,
        },
        applicant: {
          id: user_model.id,
          name: user_model.name,
          email: user_model.email,
          phone: user_model.phone,
          role: user_model.role,
          // Student profile fields (if applicant is a student)
          university_name: student_profile_model.university_name,
          home_town: student_profile_model.home_address,
          degree: student_profile_model.degree,
          grades: student_profile_model.grades,
          passing_year: student_profile_model.passing_year,
          practice_area_interests: student_profile_model.practice_area_interests,
          cv_resume: student_profile_model.cv_resume,
          linkedin_url: student_profile_model.linkedin_url,
          availability: student_profile_model.availability,
          preferred_locations: student_profile_model.preferred_locations,
          remote_ok: student_profile_model.remote_ok,
          // Lawyer profile fields (if applicant is a lawyer)
          bar_council_number: lawyer_profile_model.bar_number,
          years_of_experience: lawyer_profile_model.experience,
          practice_areas: lawyer_profile_model.practice_areas,
          practice_location: lawyer_profile_model.practice_location,
          practice_courts: lawyer_profile_model.practicing_courts,
          law_firm_name: lawyer_profile_model.law_firm,
          bio: lawyer_profile_model.bio,
        },
      })
      .from(applied_jobs_model)
      .innerJoin(jobs_model, eq(applied_jobs_model.job_id, jobs_model.id))
      .innerJoin(user_model, eq(applied_jobs_model.applicant_id, user_model.id))
      .leftJoin(
        student_profile_model,
        eq(applied_jobs_model.applicant_id, student_profile_model.id)
      )
      .leftJoin(
        lawyer_profile_model,
        eq(applied_jobs_model.applicant_id, lawyer_profile_model.id)
      )
      .where(eq(jobs_model.posted_by, lawyer_id))
      .orderBy(applied_jobs_model.applied_at);

    return {
      success: true,
      code: 200,
      message: `Found ${applications.length} applications`,
      data: applications,
    };
  } catch (error: any) {
    console.error("Error fetching job applications:", error);

    return {
      success: false,
      code: 500,
      message: "Internal server error while fetching applications",
      error: error?.message || String(error),
    };
  }
};

export const update_application_status = async (
  job_id: number,
  applicant_id: number,
  status: JobApplicationStatusType,
  notes: string | undefined,
  lawyer_id: number
) => {
  try {
    // Verify the lawyer owns this job
    const job = await db
      .select()
      .from(jobs_model)
      .where(
        and(
          eq(jobs_model.id, job_id),
          eq(jobs_model.posted_by, lawyer_id)
        )
      )
      .limit(1);

    if (job.length === 0) {
      return {
        success: false,
        code: 404,
        message:
          "Job not found or you don't have permission to update applications for this job",
      };
    }

    const result = await db
      .update(applied_jobs_model)
      .set({
        status,
        notes: notes || null,
      })
      .where(
        and(
          eq(applied_jobs_model.job_id, job_id),
          eq(applied_jobs_model.applicant_id, applicant_id)
        )
      )
      .returning();

    if (result.length === 0) {
      return {
        success: false,
        code: 404,
        message: "Application not found",
      };
    }

    return {
      success: true,
      code: 200,
      message: "Application status updated successfully",
      data: result[0],
    };
  } catch (error: any) {
    console.error("Error updating application status:", error);

    return {
      success: false,
      code: 500,
      message: "Internal server error while updating application status",
      error: error?.message || String(error),
    };
  }
};

export const schedule_interview = async (
  job_id: number,
  applicant_id: number,
  interview_datetime: string,
  interview_notes: string | undefined,
  lawyer_id: number
) => {
  try {
    // Verify the lawyer owns this job
    const job = await db
      .select()
      .from(jobs_model)
      .where(
        and(
          eq(jobs_model.id, job_id),
          eq(jobs_model.posted_by, lawyer_id)
        )
      )
      .limit(1);

    if (job.length === 0) {
      return {
        success: false,
        code: 404,
        message:
          "Job not found or you don't have permission to schedule interviews for this job",
      };
    }

    const result = await db
      .update(applied_jobs_model)
      .set({
        status: "interviewed",
        interview_scheduled: new Date(interview_datetime),
        interview_notes: interview_notes || null,
      })
      .where(
        and(
          eq(applied_jobs_model.job_id, job_id),
          eq(applied_jobs_model.applicant_id, applicant_id)
        )
      )
      .returning();

    if (result.length === 0) {
      return {
        success: false,
        code: 404,
        message: "Application not found",
      };
    }

    return {
      success: true,
      code: 200,
      message: "Interview scheduled successfully",
      data: result[0],
    };
  } catch (error: any) {
    console.error("Error scheduling interview:", error);

    return {
      success: false,
      code: 500,
      message: "Internal server error while scheduling interview",
      error: error?.message || String(error),
    };
  }
};

