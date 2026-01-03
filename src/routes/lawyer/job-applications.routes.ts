import { Elysia, t } from "elysia";
import { app_middleware } from "../../middlewares";
import {
  get_job_applications,
  update_application_status,
  schedule_interview,
} from "../../services/lawyer/job-applications.service";
import { JOB_APPLICATION_STATUS_CONST } from "@/types/shared/jobs.types";

const job_applications_routes = new Elysia({
  prefix: "/lawyer/dashboard",
})
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

  .get("/fetch-job-applications", async ({ set, store }) => {
    const response = await get_job_applications(store.id);

    set.status = response.code;
    return response;
  })

  .put(
    "/update-job-application-status",
    async ({ set, store, body }) => {
      const response = await update_application_status(
        body.job_id,
        body.applicant_id,
        body.status,
        body.notes,
        Number(store.id)
      );

      set.status = response.code;
      return response;
    },
    {
      body: t.Object({
        job_id: t.Number(),
        applicant_id: t.Number(),
        status: t.Enum(Object.fromEntries(JOB_APPLICATION_STATUS_CONST.map(x => [x, x]))),
        notes: t.Optional(t.String()),
      }),
    }
  )

  .post(
    "/schedule-job-interview",
    async ({ set, store, body }) => {
      const response = await schedule_interview(
        body.job_id,
        body.applicant_id,
        body.interview_datetime,
        body.interview_notes,
        Number(store.id)
      );

      set.status = response.code;
      return response;
    },
    {
      body: t.Object({
        job_id: t.Number(),
        applicant_id: t.Number(),
        interview_datetime: t.String(),
        interview_notes: t.Optional(t.String()),
      }),
    }
  );

export default job_applications_routes;

