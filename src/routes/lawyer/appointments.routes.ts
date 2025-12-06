import { Elysia, t } from "elysia";
import { app_middleware } from "../../middlewares";
import {
  create_appointment,
  get_appointments,
  update_appointment,
  delete_appointment,
} from "../../services/lawyer/appointments.service";

const appointment_routes = new Elysia({ prefix: "/lawyer/dashboard" })
  .state({ id: 0, role: "" })
  .guard({
    beforeHandle({ cookie, set, store, headers }) {
      const state_result = app_middleware({ cookie, headers, allowed: ["lawyer"] });

      set.status = state_result.code;
      if (!state_result.data) return state_result;

      store.id = state_result.data.id;
      store.role = state_result.data.role;
    }
  })

  .post(
    "/create-appointment",
    async ({ set, store, body }) => {
      const data = {
        ...body,
        lawyer_id: Number(store.id),
        appointment_datetime: new Date(body.appointment_datetime),
        status: body.status?.[0] || "scheduled",
      };

      const response = await create_appointment(data as any);

      set.status = response.code;
      return response;
    },
    {
      body: t.Object({
        client_name: t.String(),
        client_contact: t.String(),
        appointment_datetime: t.String(),
        reason: t.String(),
        duration_minutes: t.Number(),
        status: t.Optional(t.Array(t.String())),
      }),
    }
  )

  .get("/fetch-appointments", async ({ set, store }) => {
    const response = await get_appointments(Number(store.id));

    set.status = response.code;
    return response;
  })

  .put(
    "/update-appointment/:id",
    async ({ set, store, params, body }) => {
      const updateData = {
        ...body,
        ...(body.appointment_datetime && { appointment_datetime: new Date(body.appointment_datetime) }),
        ...(body.status && { status: body.status[0] || "scheduled" }),
      };

      const response = await update_appointment(
        Number(params.id),
        Number(store.id),
        updateData as any
      );

      set.status = response.code;
      return response;
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        client_name: t.Optional(t.String()),
        client_contact: t.Optional(t.String()),
        appointment_datetime: t.Optional(t.String()),
        reason: t.Optional(t.String()),
        duration_minutes: t.Optional(t.Number()),
        status: t.Optional(t.Array(t.String())),
      }),
    }
  )

  .delete(
    "/delete-appointment/:id",
    async ({ set, store, params }) => {
      const response = await delete_appointment(
        Number(params.id),
        Number(store.id)
      );

      set.status = response.code;
      return response;
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  );

export default appointment_routes;
