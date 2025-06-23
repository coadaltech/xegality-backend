import { Elysia, t } from "elysia";
import { authenticate_jwt } from "../middlewares";
import {
  ApplyInternshipSchema,
  PostInternshipSchema,
  SearchInternshipSchema,
} from "../types/app.types";
import {
  add_internship,
  apply_internship,
  delete_expired_internships,
  get_internships,
  search_internships,
} from "../services/shared/internships.service";
import { create_unique_id } from "../utils";

const internship_routes = new Elysia({ prefix: "/app" })
  .state({ id: 0, role: "" })
  .guard(
    {
      beforeHandle({ cookie, set, store, headers }) {
        let access_token =
          String(cookie.access_token) ||
          String(headers["authorization"]?.replace("Bearer ", "") ?? "");
        if (!access_token) {
          set.status = 404;
          return {
            success: false,
            code: 404,
            message: "No Access Token in Cookies",
          };
        }
        if (access_token.startsWith("Bearer ")) {
          access_token.replace("Bearer ", "");
        }
        const middleware_response = authenticate_jwt(access_token);
        set.status = middleware_response.code;

        if (!middleware_response.success) {
          return middleware_response;
        }
        if (!middleware_response.data?.id && !middleware_response.data?.role) {
          set.status = 404;
          return {
            success: false,
            code: 404,
            message: "Invalid Refresh Token",
          };
        }
        store.id = middleware_response.data.id;
        store.role = middleware_response.data.role;
      },
    },
    (app) =>
      app
        .get("/get-internships", async ({ set, store }) => {
          if (store.role === "consumer") {
            set.status = 409;
            return {
              success: false,
              code: 409,
              message: "Restricted Endpoints",
            };
          }
          const internships_response = await get_internships();

          set.status = internships_response.code;
          return {
            success: internships_response.success,
            code: internships_response.code,
            message: internships_response.message,
            data: internships_response?.data,
          };
        })
        .post(
          "/search-internships",
          async ({ set, store, body }) => {
            if (store.role === "consumer") {
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
          "/post-internship",
          async ({ set, store, body }) => {
            if (store.role === "consumer" || store.role === "student") {
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
            const post_internship_response = await add_internship(
              data,
              store.id
            );
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
          "/apply-internship",
          async ({ set, store, body }) => {
            if (store.role === "consumer") {
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
        .get("/delete-expired-internships", async ({ set, store }) => {
          if (store.role === "consumer") {
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
        })
  );

export default internship_routes;
