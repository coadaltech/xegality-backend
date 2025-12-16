import db from "../../config/db";
import { eq } from "drizzle-orm";
import {
  google_calendar_tokens_model,
  GoogleCalendarTokenType,
  InsertGoogleCalendarTokenType,
} from "../../models/lawyer/google-calendar.model";
import { GoogleCalendarService } from "./google-calendar.service";
import { lawyer_appoinment_model } from "../../models/lawyer/appointments.model";

export const connect_google_calendar = async (
  lawyer_id: number,
  tokens: any
) => {
  try {
    // Check if already connected
    const existing = await db
      .select()
      .from(google_calendar_tokens_model)
      .where(eq(google_calendar_tokens_model.lawyer_id, lawyer_id))
      .limit(1);

    const tokenData: InsertGoogleCalendarTokenType = {
      lawyer_id,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date ? Number(tokens.expiry_date) : undefined,
      calendar_id: "primary",
      is_active: true,
      updated_at: new Date(),
    };

    let result;
    if (existing.length > 0) {
      // Update existing connection
      result = await db
        .update(google_calendar_tokens_model)
        .set(tokenData)
        .where(eq(google_calendar_tokens_model.lawyer_id, lawyer_id))
        .returning();
    } else {
      // Create new connection
      result = await db
        .insert(google_calendar_tokens_model)
        .values(tokenData)
        .returning();
    }

    return {
      success: true,
      code: 200,
      message: "Google Calendar connected successfully",
      data: result[0],
    };
  } catch (error: any) {
    console.error("Error connecting Google Calendar:", error);

    return {
      success: false,
      code: 500,
      message: "Failed to connect Google Calendar",
      error: error?.message || String(error),
    };
  }
};

export const disconnect_google_calendar = async (lawyer_id: number) => {
  try {
    // Delete the calendar tokens
    const result = await db
      .delete(google_calendar_tokens_model)
      .where(eq(google_calendar_tokens_model.lawyer_id, lawyer_id))
      .returning();

    // Update all appointments to disable sync
    await db
      .update(lawyer_appoinment_model)
      .set({
        google_calendar_sync_enabled: false,
        google_calendar_sync_status: "not_synced",
        google_calendar_event_id: null,
      })
      .where(eq(lawyer_appoinment_model.lawyer_id, lawyer_id));

    return {
      success: true,
      code: 200,
      message: "Google Calendar disconnected successfully",
      data: result[0] || null,
    };
  } catch (error: any) {
    console.error("Error disconnecting Google Calendar:", error);

    return {
      success: false,
      code: 500,
      message: "Failed to disconnect Google Calendar",
      error: error?.message || String(error),
    };
  }
};

export const get_calendar_status = async (lawyer_id: number) => {
  try {
    const connection = await db
      .select()
      .from(google_calendar_tokens_model)
      .where(eq(google_calendar_tokens_model.lawyer_id, lawyer_id))
      .limit(1);

    if (connection.length === 0) {
      return {
        success: true,
        code: 200,
        message: "Google Calendar not connected",
        data: {
          connected: false,
          calendar_id: null,
          is_active: false,
        },
      };
    }

    const tokenInfo = connection[0];

    // Check if token is expired
    let isExpired = false;
    if (tokenInfo.expiry_date) {
      isExpired = Date.now() >= tokenInfo.expiry_date;
    }

    return {
      success: true,
      code: 200,
      message: "Calendar status retrieved successfully",
      data: {
        connected: true,
        calendar_id: tokenInfo.calendar_id,
        is_active: tokenInfo.is_active && !isExpired,
        expiry_date: tokenInfo.expiry_date,
        created_at: tokenInfo.created_at,
        is_expired: isExpired,
      },
    };
  } catch (error: any) {
    console.error("Error getting calendar status:", error);

    return {
      success: false,
      code: 500,
      message: "Failed to get calendar status",
      error: error?.message || String(error),
    };
  }
};

export const get_calendar_tokens = async (
  lawyer_id: number
): Promise<GoogleCalendarTokenType | null> => {
  try {
    const tokens = await db
      .select()
      .from(google_calendar_tokens_model)
      .where(eq(google_calendar_tokens_model.lawyer_id, lawyer_id))
      .limit(1);

    return tokens[0] || null;
  } catch (error) {
    console.error("Error getting calendar tokens:", error);
    return null;
  }
};

export const get_calendar_events = async (
  lawyer_id: number,
  timeMin?: string,
  timeMax?: string,
  maxResults: number = 50
) => {
  try {
    const tokenInfo = await get_calendar_tokens(lawyer_id);

    if (!tokenInfo || !tokenInfo.is_active) {
      return {
        success: false,
        code: 400,
        message: "Google Calendar not connected or inactive",
      };
    }

    const tokens = {
      access_token: tokenInfo.access_token,
      refresh_token: tokenInfo.refresh_token,
      expiry_date: tokenInfo.expiry_date,
    };

    const events = await GoogleCalendarService.listEvents(tokens, {
      timeMin,
      timeMax,
      maxResults,
    });

    return {
      success: true,
      code: 200,
      message: `Found ${events.length} calendar events`,
      data: events,
    };
  } catch (error: any) {
    console.error("Error getting calendar events:", error);

    return {
      success: false,
      code: 500,
      message: "Failed to fetch calendar events",
      error: error?.message || String(error),
    };
  }
};

export const sync_appointment_to_calendar = async (
  lawyer_id: number,
  appointment_id: number,
  force: boolean = false
) => {
  try {
    // Get appointment
    const appointments = await db
      .select()
      .from(lawyer_appoinment_model)
      .where(eq(lawyer_appoinment_model.id, appointment_id))
      .limit(1);

    if (appointments.length === 0) {
      return {
        success: false,
        code: 404,
        message: "Appointment not found",
      };
    }

    const appointment = appointments[0];

    // Check if lawyer has calendar connected
    const tokenInfo = await get_calendar_tokens(lawyer_id);

    if (!tokenInfo || !tokenInfo.is_active) {
      return {
        success: false,
        code: 400,
        message: "Google Calendar not connected or inactive",
      };
    }

    // Check if sync is enabled for this appointment
    if (!force && !appointment.google_calendar_sync_enabled) {
      return {
        success: false,
        code: 400,
        message: "Calendar sync is not enabled for this appointment",
      };
    }

    const tokens = {
      access_token: tokenInfo.access_token,
      refresh_token: tokenInfo.refresh_token,
      expiry_date: tokenInfo.expiry_date,
    };

    // Update sync status to pending
    await db
      .update(lawyer_appoinment_model)
      .set({ google_calendar_sync_status: "pending" })
      .where(eq(lawyer_appoinment_model.id, appointment_id));

    try {
      // Sync to Google Calendar
      const event = await GoogleCalendarService.syncAppointmentToEvent(
        tokens,
        appointment,
        appointment.google_calendar_event_id || undefined
      );

      // Update appointment with event ID and sync status
      await db
        .update(lawyer_appoinment_model)
        .set({
          google_calendar_event_id: event.id,
          google_calendar_sync_status: "synced",
          google_calendar_sync_enabled: true,
        })
        .where(eq(lawyer_appoinment_model.id, appointment_id));

      return {
        success: true,
        code: 200,
        message: "Appointment synced to Google Calendar successfully",
        data: {
          appointment_id,
          event_id: event.id,
          event_link: event.htmlLink,
        },
      };
    } catch (syncError: any) {
      // Update sync status to error
      await db
        .update(lawyer_appoinment_model)
        .set({ google_calendar_sync_status: "error" })
        .where(eq(lawyer_appoinment_model.id, appointment_id));

      throw syncError;
    }
  } catch (error: any) {
    console.error("Error syncing appointment to calendar:", error);

    return {
      success: false,
      code: 500,
      message: "Failed to sync appointment to Google Calendar",
      error: error?.message || String(error),
    };
  }
};

export const update_calendar_sync_settings = async (
  lawyer_id: number,
  syncEnabled: boolean,
  autoSync: boolean = false
) => {
  try {
    // Update all appointments for this lawyer
    await db
      .update(lawyer_appoinment_model)
      .set({
        google_calendar_sync_enabled: syncEnabled,
        google_calendar_sync_status: syncEnabled ? "not_synced" : "not_synced",
      })
      .where(eq(lawyer_appoinment_model.lawyer_id, lawyer_id));

    return {
      success: true,
      code: 200,
      message: "Calendar sync settings updated successfully",
      data: {
        sync_enabled: syncEnabled,
        auto_sync: autoSync,
      },
    };
  } catch (error: any) {
    console.error("Error updating calendar sync settings:", error);

    return {
      success: false,
      code: 500,
      message: "Failed to update calendar sync settings",
      error: error?.message || String(error),
    };
  }
};
