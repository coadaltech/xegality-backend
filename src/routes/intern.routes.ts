// import { Elysia, t } from "elysia";
// import { authenticate_jwt } from "../middlewares";
// import { add_interns, get_interns } from "../services/shared/intern.service";
// import { PostInternSchema } from "../types/app.types";

// const intern_routes = new Elysia({ prefix: "/app" })
//   .state({ id: "", role: "" })
//   .guard(
//     {
//       beforeHandle({ cookie, set, store, headers }) {
//         let access_token =
//           String(cookie.access_token) ||
//           String(headers["authorization"]?.replace("Bearer ", "") ?? "");
//         if (!access_token) {
//           set.status = 404;
//           return {
//             success: false,
//             code: 404,
//             message: "No Access Token in Cookies",
//           };
//         }
//         if (access_token.startsWith("Bearer ")) {
//           access_token.replace("Bearer ", "");
//         }
//         const middleware_response = authenticate_jwt(access_token);
//         set.status = middleware_response.code;

//         if (!middleware_response.success) {
//           return middleware_response;
//         }
//         if (!middleware_response.data?.id && !middleware_response.data?.role) {
//           set.status = 404;
//           return {
//             success: false,
//             code: 404,
//             message: "Invalid Refresh Token",
//           };
//         }
//         store.id = middleware_response.data.id;
//         store.role = middleware_response.data.role;
//       },
//     },
//     (app) =>
//       app
//         .get("/get-interns", async ({ set, store }) => {
//           if (store.role === "consumer" || store.role === "student") {
//             set.status = 409;
//             return {
//               success: false,
//               code: 409,
//               message: "Restricted Endpoints",
//             };
//           }
//           const interns_response = await get_interns();

//           set.status = interns_response.code;
//           return interns_response;
//         })
//         .post(
//           "/post-intern",
//           async ({ set, store, body }) => {
//             if (store.role === "consumer" || store.role === "student") {
//               set.status = 409;
//               return {
//                 success: false,
//                 code: 409,
//                 message: "Restricted Endpoints",
//               };
//             }

//             const data = body as unknown as {
//               id: string;
//               name: string;
//               email: string;
//               phone: number;
//               university: string;
//               year: string;
//               specialization: string;
//               start_date: Date;
//               status: string;
//               rating: number;
//               avatar: string;
//               tasks_completed: number;
//               hours_worked: number;
//               performance: string;
//               recent_activity: string;
//               supervisor: string;
//               department: string;
//               contract_type: string;
//               salary: string;
//             };
//             const add_interns_response = await add_interns(data, store.id);
//             set.status = add_interns_response.code;
//             return add_interns_response;
//           },
//           { body: PostInternSchema }
//         )
//   );

// export default intern_routes;
