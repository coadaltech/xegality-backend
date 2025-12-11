import Elysia, { t } from "elysia";
import { app_middleware } from "../../middlewares";
import {
  get_lawyer_profile,
  update_lawyer_profile,
  update_profile_picture,
} from "../../services/lawyer/core.service";
import {
  change_password,
  soft_delete_account,
} from "../../services/shared/auth.service";
import { LawyerProfileSchema } from "../../types/lawyer.types";

const lawyer_core_routes = new Elysia({ prefix: "/lawyer" })
  .state({ id: 0, role: "" })
  .guard({
    beforeHandle({ cookie, set, store, headers }) {
      const state_result = app_middleware({
        cookie,
        headers,
        allowed: ["lawyer"],
      });

      set.status = state_result.code;
      if (!state_result.data) return state_result;

      store.id = state_result.data.id;
      store.role = state_result.data.role;
    },
  })
  .get("/fetch-profile", async ({ set, store }) => {
    const profile_result = await get_lawyer_profile(store.id);

    set.status = profile_result.code;
    return profile_result;
  })
  .post(
    "/update-profile",
    async ({ body, set, store }) => {
      console.log("update profile body", body);
      const update_result = await update_lawyer_profile(store.id, body);
      console.log("update result", update_result);

      set.status = update_result.code;
      return update_result;
    },
    {
      body: LawyerProfileSchema,
    }
  )
  .post(
    "/update-profile-picture",
    async ({ body, set, store }) => {
      const update_result = await update_profile_picture(
        store.id,
        body.profile_picture
      );

      set.status = update_result.code;
      return update_result;
    },
    {
      body: t.Object({
        profile_picture: t.String(),
      }),
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

export default lawyer_core_routes;
