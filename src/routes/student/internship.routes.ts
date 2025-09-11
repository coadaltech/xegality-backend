import { Elysia, t } from "elysia";
import { app_middleware, authenticate_jwt } from "../../middlewares";
import {
  ApplyInternshipSchema,
  PostInternshipSchema,
  SearchInternshipSchema,
} from "../../types/internship.types";
import {
  apply_internship,
  create_internship,
  get_applied_internships,
  get_internships,
  search_internships,
} from "../../services/shared/internship.service";
import { create_unique_id } from "@/utils/general.utils";

const internship_routes = new Elysia({ prefix: "/student/dashboard" })
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

  .get("/fetch-all-internships", async ({ set, store }) => {
    const internships_response = await get_internships(store.id, store.role);

    set.status = internships_response.code;
    return internships_response;
  })

  .get("/fetch-applied-internships", async ({ set, store }) => {
    const internships_response = await get_applied_internships(store.id);

    set.status = internships_response.code;
    return internships_response
  })

  .post(
    "/search-internship",
    async ({ set, store, body }) => {

      const { query } = body;
      const internships_response = await search_internships(query);

      set.status = internships_response.code;
      return internships_response;
    },
    {
      body: SearchInternshipSchema,
    }
  )

  .post(
    "/apply-internship",
    async ({ set, store, body }) => {

      const { internship_id } = body;
      const apply_internship_response = await apply_internship(
        internship_id,
        store.id
      );

      set.status = apply_internship_response.code;
      return apply_internship_response;
    },
    { body: ApplyInternshipSchema }
  )


export default internship_routes;

