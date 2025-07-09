import { Elysia, t } from "elysia";
import { app_middleware } from "../../middlewares";
import { create_lawyer_connection } from "../../services/consumer/core.service";
import { FilterLawyerSchema } from "../../types/consumer.types";

const consumer_core_routes = new Elysia({ prefix: "/consumer" })
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
  .get("/fetch-filtered-lawyers", async ({ body, set, store, query }) => {

    // set.status = results.code;
    // return results;
  },
    {
      body: FilterLawyerSchema
    }
  )


export default consumer_core_routes;
