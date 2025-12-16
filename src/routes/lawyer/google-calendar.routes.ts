import { Elysia, t } from "elysia";
import { app_middleware } from "../../middlewares";
import {
  getAuthUrl,
  getAccessToken,
} from "../../config/google-calendar.config";
import {
  connect_google_calendar,
  disconnect_google_calendar,
  get_calendar_status,
  sync_appointment_to_calendar,
  get_calendar_events,
  update_calendar_sync_settings,
} from "../../services/lawyer/google-calendar-auth.service";

const google_calendar_routes = new Elysia({ prefix: "/lawyer/google-calendar" })
  .state({ id: 0, role: "" })
  .guard({
    beforeHandle({ cookie, set, store, headers }) {
      const state_result = app_middleware({
        cookie,
        headers,
        allowed: ["lawyer"],
      });

      set.status = state_result.code;
      if (!state_result.data) return state_result;

      store.id = state_result.data.id;
      store.role = state_result.data.role;
    },
  })

  // Get Google Calendar auth URL
  .get("/auth-url", async ({ set, store }) => {
    try {
      const authUrl = getAuthUrl(`lawyer_${store.id}`);

      return {
        success: true,
        code: 200,
        message: "Auth URL generated successfully",
        data: { authUrl },
      };
    } catch (error: any) {
      console.error("Error generating auth URL:", error);

      return {
        success: false,
        code: 500,
        message: "Failed to generate auth URL",
        error: error?.message || String(error),
      };
    }
  })

  // Handle Google Calendar callback (GET for redirect flow)
  .get(
    "/callback",
    async ({ query, set, store }) => {
      try {
        const { code, state, error } = query;

        if (error) {
          // Redirect back to frontend with error
          const redirectUrl = `${
            process.env.FRONTEND_URL || "http://localhost:3000"
          }/lawyer/dashboard/appointments?error=${encodeURIComponent(error)}`;
          set.status = 302;
          set.headers["Location"] = redirectUrl;
          return new Response(null, {
            status: 302,
            headers: { Location: redirectUrl },
          });
        }

        if (!code || !state) {
          const redirectUrl = `${
            process.env.FRONTEND_URL || "http://localhost:3000"
          }/lawyer/dashboard/appointments?error=missing_parameters`;
          set.status = 302;
          set.headers["Location"] = redirectUrl;
          return new Response(null, {
            status: 302,
            headers: { Location: redirectUrl },
          });
        }

        // Verify state matches lawyer ID
        const expectedState = `lawyer_${store.id}`;
        if (state !== expectedState) {
          const redirectUrl = `${
            process.env.FRONTEND_URL || "http://localhost:3000"
          }/lawyer/dashboard/appointments?error=invalid_state`;
          set.status = 302;
          set.headers["Location"] = redirectUrl;
          return new Response(null, {
            status: 302,
            headers: { Location: redirectUrl },
          });
        }

        const tokens = await getAccessToken(code as string);
        const response = await connect_google_calendar(
          Number(store.id),
          tokens
        );

        // Redirect back to frontend with success
        const redirectUrl = `${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/lawyer/dashboard/appointments?success=true`;
        set.status = 302;
        set.headers["Location"] = redirectUrl;
        return new Response(null, {
          status: 302,
          headers: { Location: redirectUrl },
        });
      } catch (error: any) {
        console.error("Error handling Google Calendar callback:", error);
        const redirectUrl = `${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/lawyer/dashboard/appointments?error=callback_failed`;
        set.status = 302;
        set.headers["Location"] = redirectUrl;
        return new Response(null, {
          status: 302,
          headers: { Location: redirectUrl },
        });
      }
    },
    {
      query: t.Object({
        code: t.Optional(t.String()),
        state: t.Optional(t.String()),
        error: t.Optional(t.String()),
      }),
    }
  )

  // Handle Google Calendar callback (POST for popup flow - kept for compatibility)
  .post(
    "/callback",
    async ({ set, store, body }) => {
      try {
        const { code, state } = body as { code: string; state: string };

        // Verify state matches lawyer ID
        const expectedState = `lawyer_${store.id}`;
        if (state !== expectedState) {
          return {
            success: false,
            code: 400,
            message: "Invalid state parameter",
          };
        }

        const tokens = await getAccessToken(code);
        const response = await connect_google_calendar(
          Number(store.id),
          tokens
        );

        set.status = response.code;
        return response;
      } catch (error: any) {
        console.error("Error handling Google Calendar callback:", error);

        return {
          success: false,
          code: 500,
          message: "Failed to connect Google Calendar",
          error: error?.message || String(error),
        };
      }
    },
    {
      body: t.Object({
        code: t.String(),
        state: t.String(),
      }),
    }
  )

  // Get calendar connection status
  .get("/status", async ({ set, store }) => {
    const response = await get_calendar_status(Number(store.id));

    set.status = response.code;
    return response;
  })

  // Disconnect Google Calendar
  .post("/disconnect", async ({ set, store }) => {
    const response = await disconnect_google_calendar(Number(store.id));

    set.status = response.code;
    return response;
  })

  // Get calendar events
  .get(
    "/events",
    async ({ set, store, query }) => {
      try {
        const {
          timeMin,
          timeMax,
          maxResults = 50,
        } = query as {
          timeMin?: string;
          timeMax?: string;
          maxResults?: number;
        };

        const response = await get_calendar_events(
          Number(store.id),
          timeMin,
          timeMax,
          maxResults
        );

        set.status = response.code;
        return response;
      } catch (error: any) {
        console.error("Error fetching calendar events:", error);

        return {
          success: false,
          code: 500,
          message: "Failed to fetch calendar events",
          error: error?.message || String(error),
        };
      }
    },
    {
      query: t.Object({
        timeMin: t.Optional(t.String()),
        timeMax: t.Optional(t.String()),
        maxResults: t.Optional(t.Number()),
      }),
    }
  )

  // Sync appointment to Google Calendar
  .post(
    "/sync/:appointmentId",
    async ({ set, store, params, body }) => {
      try {
        const { appointmentId } = params as { appointmentId: string };
        const { force = false } = body as { force?: boolean };

        const response = await sync_appointment_to_calendar(
          Number(store.id),
          Number(appointmentId),
          force
        );

        set.status = response.code;
        return response;
      } catch (error: any) {
        console.error("Error syncing appointment to calendar:", error);

        return {
          success: false,
          code: 500,
          message: "Failed to sync appointment to calendar",
          error: error?.message || String(error),
        };
      }
    },
    {
      params: t.Object({
        appointmentId: t.String(),
      }),
      body: t.Object({
        force: t.Optional(t.Boolean()),
      }),
    }
  )

  // Update calendar sync settings
  .put(
    "/sync-settings",
    async ({ set, store, body }) => {
      try {
        const { syncEnabled, autoSync = false } = body as {
          syncEnabled: boolean;
          autoSync?: boolean;
        };

        const response = await update_calendar_sync_settings(
          Number(store.id),
          syncEnabled,
          autoSync
        );

        set.status = response.code;
        return response;
      } catch (error: any) {
        console.error("Error updating calendar sync settings:", error);

        return {
          success: false,
          code: 500,
          message: "Failed to update calendar sync settings",
          error: error?.message || String(error),
        };
      }
    },
    {
      body: t.Object({
        syncEnabled: t.Boolean(),
        autoSync: t.Optional(t.Boolean()),
      }),
    }
  )

  // Test calendar connection
  .get("/test-connection", async ({ set, store }) => {
    try {
      const response = await get_calendar_events(
        Number(store.id),
        undefined,
        undefined,
        1
      );

      if (response.success) {
        return {
          success: true,
          code: 200,
          message: "Google Calendar connection is working",
          data: { connected: true },
        };
      } else {
        return {
          success: false,
          code: 400,
          message: "Google Calendar connection failed",
          data: { connected: false, error: response.message },
        };
      }
    } catch (error: any) {
      console.error("Error testing calendar connection:", error);

      return {
        success: false,
        code: 500,
        message: "Failed to test calendar connection",
        error: error?.message || String(error),
      };
    }
  });

export default google_calendar_routes;
