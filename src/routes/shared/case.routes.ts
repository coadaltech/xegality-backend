import { Elysia, t } from "elysia";
import { application_middleware } from "../../middlewares";
import { create_case, get_cases } from "../../services/shared/case.service";
import { create_unique_id } from "../../utils";
import { PostCaseSchema } from "../../types/app.types";

const case_routes = new Elysia({ prefix: "/case" })
    .state({ id: 0, role: "" })
    .guard({
        beforeHandle({ cookie, set, store, headers }) {
            const state = application_middleware({ cookie, headers });

            if (!state.data) {
                set.status = state.code;
                return {
                    success: state.success,
                    code: state.code,
                    message: state.message,
                };
            }
            if (state.data.role === "consumer" || state.data.role === "student") {
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
        const cases_response = await get_cases(store.id);
        set.status = cases_response.code;
        return {
            success: cases_response.success,
            code: cases_response.code,
            message: cases_response.message,
            data: cases_response?.data,
        };
    })
    .post(
        "/add",
        async ({ set, store, body }) => {

            // const data = {
            //     id: case_id,
            //     type: body.type,
            //     assigned_to: body.assigned_to,
            //     assigned_by: store.id,
            //     open_date: new Date(body.open_date),
            //     description: body.description,
            //     client_name: body.client_name,
            //     client_address: body.client_address,
            //     client_documents: Array.isArray(body.client_documents) ? body.client_documents : [body.client_documents],
            //     client_age: body.client_age,
            //     phone: body.phone,
            //     // timeline: body.timeline,
            // };























            
            const create_case_response = await create_case(body, store.id);
            set.status = create_case_response.code;
            if (!create_case_response.data) {
                return {
                    success: create_case_response.success,
                    code: create_case_response.code,
                    message: create_case_response.message,
                }
            }
            return {
                success: create_case_response.success,
                code: create_case_response.code,
                message: create_case_response.message,
                data: create_case_response.data,
            };
        },
        {
            body: PostCaseSchema,
        }
    )

export default case_routes;
