import db from "../../config/db";
import { eq, and } from "drizzle-orm";
import {
  lawyer_appoinment_model,
  AppointmentType,
  InsertAppointmentType,
  UpdateAppointmentType,
} from "../../models/lawyer/appointments.model";
import {
  sync_appointment_to_calendar,
  get_calendar_tokens,
} from "./google-calendar-auth.service";
import { GoogleCalendarService } from "./google-calendar.service";

export const create_appointment = async (data: InsertAppointmentType) => {
  try {
    // Check if lawyer has Google Calendar connected and auto-sync should be enabled
    const calendarTokens = await get_calendar_tokens(data.lawyer_id);
    const autoSyncEnabled = calendarTokens && calendarTokens.is_active;

    const appointmentData = {
      ...data,
      google_calendar_sync_enabled: autoSyncEnabled,
      google_calendar_sync_status: autoSyncEnabled ? "pending" : "not_synced",
    };

    const result = await db
      .insert(lawyer_appoinment_model)
      .values(appointmentData)
      .returning();

    // Auto-sync to Google Calendar if enabled
    if (autoSyncEnabled) {
      try {
        await sync_appointment_to_calendar(data.lawyer_id, result[0].id, true);
      } catch (syncError) {
        console.error(
          "Failed to auto-sync appointment to Google Calendar:",
          syncError
        );
        // Don't fail the appointment creation if sync fails
      }
    }

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
        message:
          "Appointment not found or you don't have permission to update it",
      };
    }

    const updatedAppointment = result[0];

    // Sync to Google Calendar if sync is enabled
    if (updatedAppointment.google_calendar_sync_enabled) {
      try {
        await sync_appointment_to_calendar(lawyer_id, appointment_id, true);
      } catch (syncError) {
        console.error(
          "Failed to sync appointment update to Google Calendar:",
          syncError
        );
        // Don't fail the appointment update if sync fails
      }
    }

    return {
      success: true,
      code: 200,
      message: "Appointment updated successfully",
      data: updatedAppointment,
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
    // Get appointment details before deletion for Google Calendar cleanup
    const appointment = await db
      .select()
      .from(lawyer_appoinment_model)
      .where(
        and(
          eq(lawyer_appoinment_model.id, appointment_id),
          eq(lawyer_appoinment_model.lawyer_id, lawyer_id)
        )
      )
      .limit(1);

    // Delete from database first
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
        message:
          "Appointment not found or you don't have permission to delete it",
      };
    }

    // Delete from Google Calendar if it was synced
    if (appointment.length > 0 && appointment[0].google_calendar_event_id) {
      try {
        const calendarTokens = await get_calendar_tokens(lawyer_id);
        if (calendarTokens && calendarTokens.is_active) {
          const tokens = {
            access_token: calendarTokens.access_token,
            refresh_token: calendarTokens.refresh_token || undefined,
            expiry_date: calendarTokens.expiry_date || undefined,
          };

          await GoogleCalendarService.deleteEvent(
            tokens,
            appointment[0].google_calendar_event_id
          );
        }
      } catch (syncError) {
        console.error(
          "Failed to delete appointment from Google Calendar:",
          syncError
        );
        // Don't fail the appointment deletion if calendar deletion fails
      }
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
