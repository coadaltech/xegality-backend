import { Elysia, t } from "elysia";
import { app_middleware } from "../../middlewares";
import { create_new_application, get_applications_list } from "../../services/ca/dashboard.service";
import { get_application_details, update_application } from "../../services/shared/application.service";
import { ApplicationSchema, CreateApplicationSchema, UpdateApplicationSchema } from "../../types/ca.types";
import { RoleType } from "@/types/user.types";

const ca_dashboard_routes = new Elysia({ prefix: "/ca/dashboard" })
  .state({ id: 0, role: "" })
  .guard({
    beforeHandle({ cookie, set, store, headers }) {
      const state_result = app_middleware({ cookie, headers });

      set.status = state_result.code;
      if (!state_result.data) return state_result

      store.id = state_result.data.id;
      store.role = state_result.data.role;
    }
  })

  .get("/fetch-assigned-applications",
    async ({ set, store }) => {
      const result = await get_applications_list(store.id, store.role as RoleType);

      set.status = result.code;
      return result
    })

  .post("/add-new-application",
    async ({ set, store, body }) => {
      const result = await create_new_application(body as any, store.id);

      set.status = result.code;
      return result
    },
    { body: CreateApplicationSchema }
  )

  .post("/update-application",
    async ({ set, store, body }) => {
      const result = await update_application(body as any);

      set.status = result.code;
      return result
    },
    { body: UpdateApplicationSchema }
  )

  .get("/fetch-application-details/:id", async ({ set, params }) => {
    const application_response = await get_application_details(params.id);

    set.status = application_response.code;
    return application_response;
  },
    { params: t.Object({ id: t.String({ description: "ID of the application to fetch details for" }) }) }
  )

export default ca_dashboard_routes;
