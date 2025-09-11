import { Elysia, t } from "elysia";
import { app_middleware } from "../../middlewares";
import {
  upgrade_student_to_paralegal,
  get_paralegals_under_lawyer,
} from "../../services/shared/role-management.service";

const role_management_routes = new Elysia({ prefix: "/lawyer/dashboard" })
  .state({ id: 0, role: "" })
  .guard({
    beforeHandle({ cookie, set, store, headers }) {
      const state_result = app_middleware({ cookie, headers, allowed: ["lawyer"] });

      set.status = state_result.code;
      if (!state_result.data) return state_result;

      store.id = state_result.data.id;
      store.role = state_result.data.role;
    }
  })

  .post(
    "/upgrade-student-to-paralegal",
    async ({ set, store, body }) => {
      const response = await upgrade_student_to_paralegal(body.student_id);

      set.status = response.code;
      return response;
    },
    {
      body: t.Object({
        student_id: t.Number(),
      }),
    }
  )

  .get("/fetch-paralegals", async ({ set, store }) => {
    const response = await get_paralegals_under_lawyer(Number(store.id));

    set.status = response.code;
    return response;
  });

export default role_management_routes;
