import Elysia, { t } from "elysia";
import { app_middleware } from "../../middlewares";
import { StudentProfileSchema } from "@/types/student.types";
import {
  get_student_profile,
  get_public_student_profile,
  update_student_profile,
} from "@/services/student/core.services";
import {
  change_password,
  soft_delete_account,
} from "@/services/shared/auth.service";

const student_core_routes = new Elysia({ prefix: "/student" })
  // Public route - no authentication required
  .get(
    "/profile/:id",
    async ({ params, set }) => {
      const id = parseInt(params.id);
      if (isNaN(id)) {
        set.status = 400;
        return { success: false, message: "Invalid student ID" };
      }
      const profile_result = await get_public_student_profile(id);
      set.status = profile_result.code;
      return profile_result;
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  )
  .state({ id: 0, role: "" })
  .guard({
    beforeHandle({ cookie, set, store, headers }) {
      const state_result = app_middleware({
        cookie,
        headers,
        allowed: ["student"],
      });

      set.status = state_result.code;
      if (!state_result.data) return state_result;

      store.id = state_result.data.id;
      store.role = state_result.data.role;
    },
  })
  .get("/fetch-profile", async ({ set, store }) => {
    const profile_result = await get_student_profile(store.id);

    set.status = profile_result.code;
    return profile_result;
  })
  .post(
    "/update-profile",
    async ({ body, set, store }) => {
      const update_result = await update_student_profile(store.id, body);

      set.status = update_result.code;
      return update_result;
    },
    {
      body: StudentProfileSchema,
    }
  )
  .post(
    "/change-password",
    async ({ body, set, store }) => {
      const result = await change_password(
        store.id,
        body.currentPassword,
        body.newPassword
      );

      set.status = result.code;
      return result;
    },
    {
      body: t.Object({
        currentPassword: t.String(),
        newPassword: t.String(),
      }),
    }
  )
  .post(
    "/delete-account",
    async ({ body, set, store }) => {
      const result = await soft_delete_account(store.id, body.password);

      set.status = result.code;
      return result;
    },
    {
      body: t.Object({
        password: t.String(),
      }),
    }
  );

export default student_core_routes;
