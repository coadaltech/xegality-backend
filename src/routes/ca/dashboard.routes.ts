import { Elysia, t } from "elysia";
import { app_middleware } from "../../middlewares";
import { create_new_application, get_applications } from "../../services/ca/dashboard.service";
import { ApplicationSchema } from "../../types/ca.types";

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
      const result = await get_applications(store.id);

      set.status = result.code;
      return result
    })
  .post("/add-new-application",
    async ({ set, store, body }) => {
      const result = await create_new_application(body, store.id);

      set.status = result.code;
      return result
    },
    { body: ApplicationSchema }
  )

export default ca_dashboard_routes;
