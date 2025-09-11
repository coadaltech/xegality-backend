import { Elysia, t } from "elysia";
import { app_middleware } from "../../middlewares";
import { get_chat_history } from "@/services/socket/chat.service";

const chat_routes = new Elysia({ prefix: "/chat" })
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

  .get("/fetch-chat-history/:id", async ({ set, store, params, query }) => {
    const limit = query.limit ? parseInt(query.limit) : 20;
    const offset = query.offset ? parseInt(query.offset) : 0;
    
    const chat_history = await get_chat_history(store.id, params.id, limit, offset);

    set.status = chat_history.code;
    return chat_history;
  },
    {
      params: t.Object({
        id: t.Number()
      }),
      query: t.Object({
        limit: t.Optional(t.String()),
        offset: t.Optional(t.String())
      })
    }
  )

export default chat_routes;
