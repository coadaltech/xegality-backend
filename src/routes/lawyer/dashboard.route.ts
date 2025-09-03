import { Elysia, t } from "elysia";
import { app_middleware } from "../../middlewares";
import { PostCaseSchema, PRIRORITY_CONST, STATUS_CONST } from "../../types/case.types";
import { get_cases_list } from "../../services/shared/case.service";
import { create_new_case } from "../../services/lawyer/dashboard.service";
import { PRACTICE_AREAS_CONST, RoleType } from "../../types/user.types";

const lawyer_dashboard_routes = new Elysia({ prefix: "/lawyer/dashboard" })
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
  .get("/fetch-all-cases", async ({ set, store }) => {
    const cases_response = await get_cases_list(store.id, store.role as RoleType);

    set.status = cases_response.code;
    return cases_response;
  })
  .post("/add-case",
    async ({ set, store, body }) => {
      console.log(store.id, store.role);
      const create_case_response = await create_new_case(body, store.id);

      set.status = create_case_response.code;
      return create_case_response;
    },
    {
      body: PostCaseSchema
    }
  )

export default lawyer_dashboard_routes
