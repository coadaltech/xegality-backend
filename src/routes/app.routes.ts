import { Elysia, t } from "elysia";
import { authenticate_jwt } from "../middlewares";
import { PostInternshipSchema } from "../types/app.types";
import { add_internship } from "../services/shared/internships/post-internships";
import { get_internships } from "../services/shared/internships/get-internships";

const app_routes = new Elysia({ prefix: "/app" })
  .state({ id: "", role: "" })
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
            const internship_id = `${Date.now()}${Math.random()
              .toString(36)
              .slice(2, 6)}`;
            const data = body as unknown as {
              id: typeof internship_id;
              title: string;
              firm_name: string;
              location: string;
              department: string;
              position_type: string;
              duration: string;
              compensation_type: string;
              salary_amount: string;
              start_date: Date;
              application_deadline: Date;
              description: string;
              requirements: string[];
              benefits: string[];
              is_remote: boolean;
              accepts_international: boolean;
              provides_housing: boolean;
              employer_id: string;
              employer_email: string;
              posted_date: Date;
              applicants_till_now?: number;
              views?: number;
              rating?: number;
            };
            data.id = internship_id;
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
          { body: PostInternshipSchema }
        )
  );

export default app_routes;
