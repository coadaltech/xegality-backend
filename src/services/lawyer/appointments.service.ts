import db from "../../config/db";
import { eq, and } from "drizzle-orm";
import { lawyer_appoinment_model, AppointmentType, InsertAppointmentType, UpdateAppointmentType } from "../../models/lawyer/appointments.model";

export const create_appointment = async (data: InsertAppointmentType) => {
  try {
    const result = await db
      .insert(lawyer_appoinment_model)
      .values(data)
      .returning();

    return {
      success: true,
      code: 201,
      message: "Appointment created successfully",
      data: result[0],
    };
  } catch (error: any) {
    console.error("Error creating appointment:", error);

    return {
      success: false,
      code: 500,
      message: "Internal server error while creating appointment",
      error: error?.message || String(error),
    };
  }
};

export const get_appointments = async (lawyer_id: number) => {
  try {
    const appointments = await db
      .select()
      .from(lawyer_appoinment_model)
      .where(eq(lawyer_appoinment_model.lawyer_id, lawyer_id))
      .orderBy(lawyer_appoinment_model.appointment_datetime);

    return {
      success: true,
      code: 200,
      message: `Found ${appointments.length} appointments`,
      data: appointments,
    };
  } catch (error: any) {
    console.error("Error fetching appointments:", error);

    return {
      success: false,
      code: 500,
      message: "Internal server error while fetching appointments",
      error: error?.message || String(error),
    };
  }
};

export const update_appointment = async (
  appointment_id: number,
  lawyer_id: number,
  data: UpdateAppointmentType
) => {
  try {
    const result = await db
      .update(lawyer_appoinment_model)
      .set(data)
      .where(
        and(
          eq(lawyer_appoinment_model.id, appointment_id),
          eq(lawyer_appoinment_model.lawyer_id, lawyer_id)
        )
      )
      .returning();

    if (result.length === 0) {
      return {
        success: false,
        code: 404,
        message: "Appointment not found or you don't have permission to update it",
      };
    }

    return {
      success: true,
      code: 200,
      message: "Appointment updated successfully",
      data: result[0],
    };
  } catch (error: any) {
    console.error("Error updating appointment:", error);

    return {
      success: false,
      code: 500,
      message: "Internal server error while updating appointment",
      error: error?.message || String(error),
    };
  }
};

export const delete_appointment = async (
  appointment_id: number,
  lawyer_id: number
) => {
  try {
    const result = await db
      .delete(lawyer_appoinment_model)
      .where(
        and(
          eq(lawyer_appoinment_model.id, appointment_id),
          eq(lawyer_appoinment_model.lawyer_id, lawyer_id)
        )
      )
      .returning();

    if (result.length === 0) {
      return {
        success: false,
        code: 404,
        message: "Appointment not found or you don't have permission to delete it",
      };
    }

    return {
      success: true,
      code: 200,
      message: "Appointment deleted successfully",
    };
  } catch (error: any) {
    console.error("Error deleting appointment:", error);

    return {
      success: false,
      code: 500,
      message: "Internal server error while deleting appointment",
      error: error?.message || String(error),
    };
  }
};
