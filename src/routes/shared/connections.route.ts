import Elysia, { t } from "elysia";
import { app_middleware } from "../../middlewares";
import { create_connection } from "../../services/shared/connection.service";

const shared_routes = new Elysia({ prefix: "/shared" })
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

  .post("/connect/:to",
    async ({ set, store, params }) => {

      const connection_request_result = await create_connection(store.id, params.to)

      set.status = connection_request_result.code;
      return connection_request_result;

    },
    {
      params: t.Object({
        to: t.Number({ description: "ID of the person to connect with" })
      })
    }
  )

export default shared_routes;
