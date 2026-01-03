import Elysia, { t } from "elysia";
import { app_middleware } from "../../middlewares";
import {
  get_lawyer_profile,
  update_lawyer_profile,
} from "../../services/lawyer/core.service";
import { LawyerProfileSchema } from "../../types/lawyer.types";
import { get_user_details } from "@/services/shared/user.service";
import { RoleType } from "@/types/user.types";

const user_routes = new Elysia({ prefix: "/user" })
  .state({ id: 0, role: "" })
  .guard({
    beforeHandle({ cookie, set, store, headers }) {
      const state_result = app_middleware({ cookie, headers });

      set.status = state_result.code;
      if (!state_result.data) return state_result;

      store.id = state_result.data.id;
      store.role = state_result.data.role;
    },
  })
  .get("/whoami", async ({ set, store }) => {
    const user_details = await get_user_details(
      store.id,
      store.role as RoleType
    );

    set.status = user_details.code;
    return user_details;
  });

export default user_routes;
