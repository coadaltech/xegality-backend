import {
  calendar,
  oauth2Client,
  refreshAccessToken,
} from "../../config/google-calendar.config";
import { calendar_v3 } from "googleapis";

export interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
  location?: string;
  extendedProperties?: {
    private?: {
      appointmentId?: string;
      source?: string;
    };
  };
}

export interface GoogleTokenInfo {
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
}

export class GoogleCalendarService {
  private static async getAuthenticatedClient(tokens: GoogleTokenInfo) {
    oauth2Client.setCredentials(tokens);

    // Check if token needs refresh
    if (tokens.expiry_date && Date.now() >= tokens.expiry_date) {
      if (tokens.refresh_token) {
        const newCredentials = await refreshAccessToken(tokens.refresh_token);
        oauth2Client.setCredentials(newCredentials);
        return newCredentials;
      } else {
        throw new Error("Access token expired and no refresh token available");
      }
    }

    return tokens;
  }

  static async createEvent(
    tokens: GoogleTokenInfo,
    eventData: GoogleCalendarEvent
  ): Promise<calendar_v3.Schema$Event> {
    try {
      await this.getAuthenticatedClient(tokens);

      const response = await calendar.events.insert({
        calendarId: "primary" as string,
        requestBody: {
          ...eventData,
          extendedProperties: {
            private: {
              appointmentId:
                eventData.extendedProperties?.private?.appointmentId,
              source: "xegality",
            },
          },
        },
      });

      return response.data!;
    } catch (error) {
      console.error("Error creating Google Calendar event:", error);
      throw error;
    }
  }

  static async updateEvent(
    tokens: GoogleTokenInfo,
    eventId: string,
    eventData: Partial<GoogleCalendarEvent>
  ): Promise<calendar_v3.Schema$Event> {
    try {
      await this.getAuthenticatedClient(tokens);

      const response = await calendar.events.update({
        calendarId: "primary" as string,
        eventId: eventId,
        requestBody: eventData,
      });

      return response.data!;
    } catch (error) {
      console.error("Error updating Google Calendar event:", error);
      throw error;
    }
  }

  static async deleteEvent(
    tokens: GoogleTokenInfo,
    eventId: string
  ): Promise<void> {
    try {
      await this.getAuthenticatedClient(tokens);

      await calendar.events.delete({
        calendarId: "primary" as string,
        eventId: eventId,
      });
    } catch (error) {
      console.error("Error deleting Google Calendar event:", error);
      throw error;
    }
  }

  static async getEvent(
    tokens: GoogleTokenInfo,
    eventId: string
  ): Promise<calendar_v3.Schema$Event> {
    try {
      await this.getAuthenticatedClient(tokens);

      const response = await calendar.events.get({
        calendarId: "primary" as string,
        eventId: eventId,
      });

      return response.data!;
    } catch (error) {
      console.error("Error fetching Google Calendar event:", error);
      throw error;
    }
  }

  static async listEvents(
    tokens: GoogleTokenInfo,
    options: {
      timeMin?: string;
      timeMax?: string;
      q?: string;
      maxResults?: number;
    } = {}
  ): Promise<calendar_v3.Schema$Event[]> {
    try {
      await this.getAuthenticatedClient(tokens);

      const response = await calendar.events.list({
        calendarId: "primary" as string,
        timeMin: options.timeMin,
        timeMax: options.timeMax,
        q: options.q,
        maxResults: options.maxResults || 100,
        singleEvents: true,
        orderBy: "startTime",
      });

      return response.data.items || [];
    } catch (error) {
      console.error("Error listing Google Calendar events:", error);
      throw error;
    }
  }

  static async syncAppointmentToEvent(
    tokens: GoogleTokenInfo,
    appointment: {
      id: number;
      client_name: string;
      client_contact: string;
      appointment_datetime: Date;
      reason: string;
      duration_minutes: number;
      status: string;
    },
    existingEventId?: string
  ): Promise<calendar_v3.Schema$Event> {
    const startTime = new Date(appointment.appointment_datetime);
    const endTime = new Date(
      startTime.getTime() + appointment.duration_minutes * 60000
    );

    const eventData: GoogleCalendarEvent = {
      summary: `Appointment: ${appointment.reason}`,
      description: `Client: ${appointment.client_name}\nContact: ${appointment.client_contact}\nStatus: ${appointment.status}`,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      extendedProperties: {
        private: {
          appointmentId: appointment.id.toString(),
          source: "xegality",
        },
      },
    };

    if (existingEventId) {
      return await this.updateEvent(tokens, existingEventId, eventData);
    } else {
      return await this.createEvent(tokens, eventData);
    }
  }

  static async findEventByAppointmentId(
    tokens: GoogleTokenInfo,
    appointmentId: string
  ): Promise<calendar_v3.Schema$Event | null> {
    try {
      const events = await this.listEvents(tokens, {
        q: `appointmentId:${appointmentId}`,
        maxResults: 10,
      });

      return (
        events.find(
          (event) =>
            event.extendedProperties?.private?.appointmentId ===
              appointmentId &&
            event.extendedProperties?.private?.source === "xegality"
        ) || null
      );
    } catch (error) {
      console.error("Error finding event by appointment ID:", error);
      return null;
    }
  }
}
