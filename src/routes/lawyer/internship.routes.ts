import { Elysia, t } from "elysia";
import { app_middleware, authenticate_jwt } from "../../middlewares";
import {
  ApplyInternshipSchema,
  PostInternshipSchema,
  SearchInternshipSchema,
} from "../../types/internship.types";
import {
  create_internship,
  get_internships,
} from "../../services/shared/internship.service";
import { create_unique_id } from "@/utils/general.utils";

const lawyer_internship_routes = new Elysia({ prefix: "/lawyer/dashboard" })
  .state({ id: 0, role: "" })
  .guard({
    beforeHandle({ cookie, set, store, headers }) {
      const state_result = app_middleware({ cookie, headers, allowed: ["student", "lawyer"] });

      set.status = state_result.code;
      if (!state_result.data) return state_result

      store.id = state_result.data.id;
      store.role = state_result.data.role;
    }
  })

  .post(
    "/create-internship",
    async ({ set, store, body }) => {

      const internship_id = create_unique_id();

      const data = {
        id: internship_id,
        title: body.title,
        description: body.description,
        location: body.location,
        specialization: body.specialization,
        designation: body.designation,
        duration: body.duration,
        application_deadline: new Date(body.application_deadline),
        posted_by: Number(store.id),
        compensation_type: body.compensation_type,
        salary_amount: body.salary_amount,
        requirements: body.requirements,
        benefits: body.benefits,
      };

      const post_internship_response = await create_internship(data);

      set.status = post_internship_response.code;
      return post_internship_response;
    },
    {
      body: PostInternshipSchema,
    }
  )

  .get("/fetch-all-internships", async ({ set, store }) => {
    const internships_response = await get_internships(store.id, store.role);

    set.status = internships_response.code;
    return internships_response;
  })

export default lawyer_internship_routes;
