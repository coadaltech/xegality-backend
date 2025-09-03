import { Elysia, t } from "elysia";
import { app_middleware } from "../../middlewares";
import { ConsumerProfileSchema, FilterLawyerSchema } from "../../types/consumer.types";
import { get_filtered_lawyers, get_random_lawyers } from "@/services/consumer/find-lawyers.service";
import { get_consumer_profile, update_consumer_profile } from "@/services/consumer/core.service";

const consumer_core_routes = new Elysia({ prefix: "/consumer" })
  .state({ id: 0, role: "" })
  .guard({
    beforeHandle({ cookie, set, store, headers }) {
      const state_result = app_middleware({ cookie, headers, allowed: ["consumer"] });

      set.status = state_result.code;
      if (!state_result.data) return state_result

      store.id = state_result.data.id;
      store.role = state_result.data.role;
    }
  })

  .get("/get-random-lawyers", async ({ set, query }) => {
    const random_lawyers = await get_random_lawyers(query.limit || 10);

    set.status = random_lawyers.code;
    return random_lawyers;
  },
    {
      query: t.Object({
        limit: t.Optional(t.Number())
      })
    }
  )

  .post("/fetch-filtered-lawyers", async ({ body, set }) => {
    const filtered_res = await get_filtered_lawyers(body)

    set.status = filtered_res.code;
    return filtered_res;
  },
    {
      body: FilterLawyerSchema
    }
  )

  .get("/fetch-profile", async ({ set, store }) => {
    const profile_result = await get_consumer_profile(store.id);

    set.status = profile_result.code;
    return profile_result;
  })

  .post("/update-profile", async ({ body, set, store }) => {
    const update_result = await update_consumer_profile(store.id, body);

    set.status = update_result.code;
    return update_result;
  }, {
    body: ConsumerProfileSchema
  })


export default consumer_core_routes;
