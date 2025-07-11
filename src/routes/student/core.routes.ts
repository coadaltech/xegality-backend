import Elysia, { t } from "elysia";
import { app_middleware } from "../../middlewares";
import { StudentProfileSchema } from "../../types/student.types";
import { update_student_profile } from "../../services/student/core.service";

const student_core_routes = new Elysia({ prefix: "/student" })
  .state({ id: 0, role: "" })
  .guard({
    beforeHandle({ cookie, set, store, headers }) {
      const state_result = app_middleware({ cookie, headers, allowed: ["student"] });

      set.status = state_result.code;
      if (!state_result.data) return state_result

      store.id = state_result.data.id;
      store.role = state_result.data.role;
    }
  })

  .put("/update-profile",
    async ({ set, store, body }) => {

      let body_id = { ...body, id: store.id }
      const update_result = await update_student_profile(body_id);

      set.status = update_result.code;
      return update_result;
    },
    {
      body: StudentProfileSchema
    }
  )

export default student_core_routes;
