import Elysia, { t } from "elysia";
import { app_middleware } from "../../middlewares";
import {
  search_firms,
  get_my_firm,
  create_firm,
  update_firm,
  associate_firm,
} from "../../services/lawyer/firm.service";
import { LawyerFirmSchema } from "../../types/lawyer/firm.types";

const firm_routes = new Elysia({ prefix: "/lawyer" })
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
  .get("/firms/search", async ({ query, set, store }) => {
    const search_result = await search_firms(query.query || "");

    set.status = search_result.code;
    return search_result;
  })
  .get("/firms/my-firm", async ({ set, store }) => {
    const firm_result = await get_my_firm(store.id);

    set.status = firm_result.code;
    return firm_result;
  })
  .post(
    "/firms/create",
    async ({ body, set, store }) => {
      const create_result = await create_firm(store.id, body);

      set.status = create_result.code;
      return create_result;
    },
    {
      body: LawyerFirmSchema,
    }
  )
  .post(
    "/firms/update",
    async ({ body, set, store }) => {
      const update_result = await update_firm(
        store.id,
        body.firm_id,
        body.firm_data
      );

      set.status = update_result.code;
      return update_result;
    },
    {
      body: t.Object({
        firm_id: t.Number(),
        firm_data: LawyerFirmSchema,
      }),
    }
  )
  .post(
    "/firms/associate",
    async ({ body, set, store }) => {
      const associate_result = await associate_firm(store.id, body.firm_id);

      set.status = associate_result.code;
      return associate_result;
    },
    {
      body: t.Object({
        firm_id: t.Number(),
      }),
    }
  );

export default firm_routes;

