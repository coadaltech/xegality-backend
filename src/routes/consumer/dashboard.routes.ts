import { Elysia, t } from "elysia";
import { app_middleware, authenticate_jwt } from "../../middlewares";
import { get_connected_lawyers } from "../../services/consumer/dashboard.service";
import { get_case_details, get_cases_list } from "../../services/shared/case.service";
import { get_applications_list } from "../../services/shared/application.service";

const consumer_dashboard_routes = new Elysia({ prefix: "/consumer/dashboard" })
  .state({ id: 0, role: "" })
  .guard({
    beforeHandle({ cookie, set, store, headers }) {
      const state_result = app_middleware({ cookie, headers, allowed: ["consumer"] });

      set.status = state_result.code;
      if (!state_result.data) return state_result

      store.id = state_result.data.id;
      store.role = state_result.data.role;
    }
  })
  .get("/fetch-connected-lawyers",
    async ({ set, store }) => {
      const results = await get_connected_lawyers(store.id)

      set.status = results.code;
      return results
    }
  )
  .get("/list-all-cases",
    async ({ set, params, store }) => {
      const results = await get_cases_list(store.id, "consumer")

      set.status = results.code;
      return results
    }
  )
  .get("/fetch-case-updates",
    async ({ set, params }) => {
      const results = await get_case_details(params.case_id)

      set.status = results.code;
      return results
    },
    {
      params: t.Object({
        case_id: t.String({ description: "ID of the case to fetch updates for" })
      }),
    }
  )
  .get("/fetch-all-applications",
    async ({ set, params }) => {
      const results = await get_applications_list(params.consumer_id, "consumer")

      set.status = results.code;
      return results
    },
    {
      params: t.Object({
        consumer_id: t.Number({ description: "ID of the consumer to fetch applications for" })
      }),
    }
  )

export default consumer_dashboard_routes;
