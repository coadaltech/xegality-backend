import Elysia, { t } from "elysia";
import { app_middleware } from "../../middlewares";

const lawyer_core_routes = new Elysia({ prefix: "/lawyer" })
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

export default lawyer_core_routes;
