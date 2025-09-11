import db from "../../config/db";
import { eq, and } from "drizzle-orm";
import { applied_internship_model, internship_model } from "../../models/shared/internship.model";
import { user_model } from "../../models/shared/user.model";
import { student_profile_model } from "../../models/student/student.model";

export const get_internship_applications = async (lawyer_id: number) => {
  try {
    const applications = await db
      .select({
        internship_id: applied_internship_model.internship_id,
        student_id: applied_internship_model.student_id,
        applied_at: applied_internship_model.applied_at,
        status: applied_internship_model.status,
        notes: applied_internship_model.notes,
        interview_scheduled: applied_internship_model.interview_scheduled,
        interview_notes: applied_internship_model.interview_notes,
        internship: {
          id: internship_model.id,
          title: internship_model.title,
          description: internship_model.description,
          location: internship_model.location,
          specialization: internship_model.specialization,
          designation: internship_model.designation,
          duration: internship_model.duration,
          compensation_type: internship_model.compensation_type,
          salary_amount: internship_model.salary_amount,
          application_deadline: internship_model.application_deadline,
          requirements: internship_model.requirements,
          benefits: internship_model.benefits,
          posted_by: internship_model.posted_by,
        },
        student: {
          id: user_model.id,
          name: user_model.name,
          email: user_model.email,
          phone: user_model.phone,
          university_name: student_profile_model.university_name,
          degree: student_profile_model.degree,
          grades: student_profile_model.grades,
          passing_year: student_profile_model.passing_year,
          practice_area_interests: student_profile_model.practice_area_interests,
          cv_resume: student_profile_model.cv_resume,
          linkedin_url: student_profile_model.linkedin_url,
          availability: student_profile_model.availability,
          preferred_locations: student_profile_model.preferred_locations,
          remote_ok: student_profile_model.remote_ok,
        },
      })
      .from(applied_internship_model)
      .innerJoin(internship_model, eq(applied_internship_model.internship_id, internship_model.id))
      .innerJoin(user_model, eq(applied_internship_model.student_id, user_model.id))
      .leftJoin(student_profile_model, eq(applied_internship_model.student_id, student_profile_model.id))
      .where(eq(internship_model.posted_by, lawyer_id))
      .orderBy(applied_internship_model.applied_at);

    return {
      success: true,
      code: 200,
      message: `Found ${applications.length} applications`,
      data: applications,
    };
  } catch (error: any) {
    console.error("Error fetching internship applications:", error);

    return {
      success: false,
      code: 500,
      message: "Internal server error while fetching applications",
      error: error?.message || String(error),
    };
  }
};

export const update_application_status = async (
  internship_id: number,
  student_id: number,
  status: string,
  notes: string | undefined,
  lawyer_id: number
) => {
  try {
    // Verify the lawyer owns this internship
    const internship = await db
      .select()
      .from(internship_model)
      .where(
        and(
          eq(internship_model.id, internship_id),
          eq(internship_model.posted_by, lawyer_id)
        )
      )
      .limit(1);

    if (internship.length === 0) {
      return {
        success: false,
        code: 404,
        message: "Internship not found or you don't have permission to update applications for this internship",
      };
    }

    const result = await db
      .update(applied_internship_model)
      .set({
        status,
        notes: notes || null,
      })
      .where(
        and(
          eq(applied_internship_model.internship_id, internship_id),
          eq(applied_internship_model.student_id, student_id)
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
  internship_id: number,
  student_id: number,
  interview_datetime: string,
  interview_notes: string | undefined,
  lawyer_id: number
) => {
  try {
    // Verify the lawyer owns this internship
    const internship = await db
      .select()
      .from(internship_model)
      .where(
        and(
          eq(internship_model.id, internship_id),
          eq(internship_model.posted_by, lawyer_id)
        )
      )
      .limit(1);

    if (internship.length === 0) {
      return {
        success: false,
        code: 404,
        message: "Internship not found or you don't have permission to schedule interviews for this internship",
      };
    }

    const result = await db
      .update(applied_internship_model)
      .set({
        status: "interviewed",
        interview_scheduled: new Date(interview_datetime),
        interview_notes: interview_notes || null,
      })
      .where(
        and(
          eq(applied_internship_model.internship_id, internship_id),
          eq(applied_internship_model.student_id, student_id)
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
