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
  delete_expired_internships,
  get_applied_internships,
  get_internships,
  search_internships,
} from "../../services/shared/internship.service";
import { create_unique_id } from "@/utils/general.utils";

const internship_routes = new Elysia({ prefix: "/internship" })
  .state({ id: 0, role: "" })
  .guard({
    beforeHandle({ cookie, set, store, headers }) {
      const state = app_middleware({ cookie, headers });

      if (!state.data) {
        set.status = state.code;
        return {
          success: state.success,
          code: state.code,
          message: state.message,
        };
      }
      if (state.data.role === "consumer") {
        set.status = 409;
        return {
          success: false,
          code: 409,
          message: "Restricted Endpoints",
        };
      }

      store.id = state.data.id;
      store.role = state.data.role;
    },
  })
  .get("/all", async ({ set, store }) => {
    const internships_response = await get_internships(store.id, store.role);

    set.status = internships_response.code;
    return {
      success: internships_response.success,
      code: internships_response.code,
      message: internships_response.message,
      data: internships_response?.data,
    };
  })
  .get("/applied", async ({ set, store }) => {
    if (store.role === "lawyer" || store.role === "paralegal") {
      set.status = 409;
      return {
        success: false,
        code: 409,
        message: "Restricted Endpoints",
      };
    }
    const internships_response = await get_applied_internships(store.id);

    set.status = internships_response.code;
    return {
      success: internships_response.success,
      code: internships_response.code,
      message: internships_response.message,
      data: internships_response?.data,
    };
  })
  .post(
    "/search",
    async ({ set, store, body }) => {
      if (store.role === "lawyer" || store.role === "paralegal") {
        set.status = 409;
        return {
          success: false,
          code: 409,
          message: "Restricted Endpoints",
        };
      }
      const { query } = body;
      const internships_response = await search_internships(query);

      set.status = internships_response.code;
      return {
        success: internships_response.success,
        code: internships_response.code,
        message: internships_response.message,
        data: internships_response?.data,
      };
    },
    {
      body: SearchInternshipSchema,
    }
  )
  .post(
    "/add",
    async ({ set, store, body }) => {
      if (store.role === "student") {
        set.status = 409;
        return {
          success: false,
          code: 409,
          message: "Restricted Endpoints",
        };
      }
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
      return {
        success: post_internship_response.success,
        code: post_internship_response.code,
        message: post_internship_response.message,
        data: post_internship_response?.data,
      };
    },
    {
      body: PostInternshipSchema,
    }
  )
  .post(
    "/apply",
    async ({ set, store, body }) => {
      if (store.role === "lawyer" || store.role === "paralegal") {
        set.status = 409;
        return {
          success: false,
          code: 409,
          message: "Restricted Endpoints",
        };
      }
      const { internship_id } = body;
      const apply_internship_response = await apply_internship(
        internship_id,
        store.id
      );
      set.status = apply_internship_response.code;
      return {
        success: apply_internship_response.success,
        code: apply_internship_response.code,
        message: apply_internship_response.message,
      };
    },
    { body: ApplyInternshipSchema }
  )
  .get("/expired", async ({ set, store }) => {
    if (store.role === "student") {
      set.status = 409;
      return {
        success: false,
        code: 409,
        message: "Restricted Endpoints",
      };
    }
    const internships_response = await delete_expired_internships();

    set.status = internships_response.code;
    return {
      success: internships_response.success,
      code: internships_response.code,
      message: internships_response.message,
      data: internships_response?.data,
    };
  });

export default internship_routes;

