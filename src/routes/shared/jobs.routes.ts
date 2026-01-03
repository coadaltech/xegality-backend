import { Elysia, t } from "elysia";
import { app_middleware } from "../../middlewares";
import {
  ApplyJobSchema,
  SearchJobSchema,
} from "../../types/shared/jobs.types";
import {
  apply_job,
  get_applied_jobs,
  get_all_jobs,
  get_jobs,
  get_applicant_jobs_by_status,
  search_jobs,
} from "../../services/shared/jobs.service";

const jobs_routes = new Elysia({ prefix: "/jobs" })
  .state({ id: 0, role: "" })
  .guard({
    beforeHandle({ cookie, set, store, headers }) {
      const state_result = app_middleware({
        cookie,
        headers,
        allowed: ["student", "lawyer"],
      });

      set.status = state_result.code;
      if (!state_result.data) return state_result;

      store.id = state_result.data.id;
      store.role = state_result.data.role;
    },
  })

  .get("/fetch-all-jobs", async ({ set, store }) => {
    const jobs_response = await get_all_jobs(store.id);

    set.status = jobs_response.code;
    return jobs_response;
  })

  .get("/fetch-applied-jobs", async ({ set, store }) => {
    const jobs_response = await get_applied_jobs(store.id);

    set.status = jobs_response.code;
    return jobs_response;
  })

  .get("/fetch-jobs/:status", async ({ set, store, params }) => {
    const { status } = params;
    const jobs_response = await get_applicant_jobs_by_status(
      store.id,
      status
    );

    set.status = jobs_response.code;
    return jobs_response;
  })

  .post(
    "/search-job",
    async ({ set, store, body }) => {
      const { query } = body;
      const jobs_response = await search_jobs(query);

      set.status = jobs_response.code;
      return jobs_response;
    },
    {
      body: SearchJobSchema,
    }
  )

  .post(
    "/apply-job",
    async ({ set, store, body }) => {
      const { job_id } = body;
      const apply_job_response = await apply_job(job_id, store.id);

      set.status = apply_job_response.code;
      return apply_job_response;
    },
    { body: ApplyJobSchema }
  );

export default jobs_routes;

