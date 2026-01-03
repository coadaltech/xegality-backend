import { Elysia, t } from "elysia";
import { app_middleware } from "../../middlewares";
import { JobSchema } from "../../types/shared/jobs.types";
import {
  create_job,
  get_jobs,
  update_job,
  delete_job,
} from "../../services/shared/jobs.service";
import { create_unique_id } from "@/utils/general.utils";

const lawyer_jobs_routes = new Elysia({ prefix: "/lawyer/dashboard" })
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

  .post(
    "/create-job",
    async ({ set, store, body }) => {
      const job_id = create_unique_id();

      const data = {
        id: job_id,
        title: body.title || "",
        law_firm: body.law_firm,
        description: body.description || "",
        responsibilities: body.responsibilities,
        location: body.location || "",
        domain: body.domain || ["civil"],
        designation: body.designation || "",
        type: body.type || ["full_time"],
        required_experience: body.required_experience,
        required_education: body.required_education,
        salary_pay: body.salary_pay,
        compensation_type: body.compensation_type,
        duration: body.duration,
        application_deadline: new Date(body.application_deadline || ""),
        required_skills: body.required_skills,
        benefits: body.benefits,
        posted_by: Number(store.id),
        posted_date: new Date(),
      };

      const post_job_response = await create_job(data);

      set.status = post_job_response.code;
      return post_job_response;
    },
    {
      body: JobSchema,
    }
  )

  .get("/fetch-all-jobs", async ({ set, store }) => {
    const jobs_response = await get_jobs(store.id, store.role);

    set.status = jobs_response.code;
    return jobs_response;
  })

  .put(
    "/update-job/:id",
    async ({ set, store, params, body }) => {
      const response = await update_job(
        Number(params.id),
        Number(store.id),
        body
      );

      set.status = response.code;
      return response;
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: JobSchema,
    }
  )

  .delete(
    "/delete-job/:id",
    async ({ set, store, params }) => {
      const response = await delete_job(
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

export default lawyer_jobs_routes;

