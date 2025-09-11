import { Elysia, t } from "elysia";
import { app_middleware } from "../../middlewares";
import {
  get_internship_applications,
  update_application_status,
  schedule_interview,
} from "../../services/lawyer/internship-applications.service";

const internship_applications_routes = new Elysia({ prefix: "/lawyer/dashboard" })
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

  .get("/fetch-internship-applications", async ({ set, store }) => {
    const response = await get_internship_applications(store.id);

    set.status = response.code;
    return response;
  })

  .put(
    "/update-application-status",
    async ({ set, store, body }) => {
      const response = await update_application_status(
        body.internship_id,
        body.student_id,
        body.status,
        body.notes,
        Number(store.id)
      );

      set.status = response.code;
      return response;
    },
    {
      body: t.Object({
        internship_id: t.Number(),
        student_id: t.Number(),
        status: t.String(),
        notes: t.Optional(t.String()),
      }),
    }
  )

  .post(
    "/schedule-interview",
    async ({ set, store, body }) => {
      const response = await schedule_interview(
        body.internship_id,
        body.student_id,
        body.interview_datetime,
        body.interview_notes,
        Number(store.id)
      );

      set.status = response.code;
      return response;
    },
    {
      body: t.Object({
        internship_id: t.Number(),
        student_id: t.Number(),
        interview_datetime: t.String(),
        interview_notes: t.Optional(t.String()),
      }),
    }
  );

export default internship_applications_routes;
