import Elysia, { t } from "elysia";
import { app_middleware } from "../../middlewares";
import { StudentProfileSchema } from "@/types/student.types";
import { get_student_profile, update_student_profile } from "@/services/student/core.services";

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
  .get("/fetch-profile", async ({ set, store }) => {
    const profile_result = await get_student_profile(store.id);

    set.status = profile_result.code;
    return profile_result;
  })
  .post("/update-profile", async ({ body, set, store }) => {
    const update_result = await update_student_profile(store.id, body);

    set.status = update_result.code;
    return update_result;
  }, {
    body: StudentProfileSchema
  })

export default student_core_routes;

