import { Elysia, t } from "elysia";
import { application_middleware, authenticate_jwt } from "../../middlewares";
import { get_connected_lawyers } from "../../services/consumer/dashboard.service";

const consumer_dashboard_routes = new Elysia({ prefix: "/dashboard" })
  .state({ id: 0, role: "" })
  .guard(
    {
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

        store.id = state.data.id;
        store.role = state.data.role;
      }
    })
  .get("/get-connected-lawyers",
    async ({ set, store }) => {

      console.log("Store ID:", store.id);
      await get_connected_lawyers(store.id)
      return {
        success: true,
        code: 200,
        message: "Connected lawyers retrieved successfully",
      }
    }
  )

export default consumer_dashboard_routes;
