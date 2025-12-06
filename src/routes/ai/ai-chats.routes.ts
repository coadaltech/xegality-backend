import { Elysia, t } from "elysia";
import { app_middleware } from "@/middlewares";
import {
  create_session,
  get_user_sessions,
  get_session_messages,
  send_message,
  update_session,
  delete_session,
  get_ai_response,
} from "@/services/ai/ai-chats.service";

const ai_chat_routes = new Elysia({ prefix: "/ai-chat" })
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

  // Create new chat session
  .post(
    "/session",
    async ({ store, body, set }) => {
      const response = await create_session(store.id, body.title);
      set.status = response.code;
      return response;
    },
    {
      body: t.Object({
        title: t.Optional(t.String()),
      }),
    }
  )

  // Get all user sessions
  .get("/sessions", async ({ store, set }) => {
    const response = await get_user_sessions(store.id);
    set.status = response.code;
    return response;
  })

  // Get messages for a session
  .get("/session/:sessionId/messages", async ({ store, params, set }) => {
    const response = await get_session_messages(
      store.id,
      Number(params.sessionId)
    );
    set.status = response.code;
    return response;
  })

  // Send message in a session
  .post(
    "/session/:sessionId/message",
    async ({ store, params, body, set }) => {
      const response = await send_message(
        Number(params.sessionId),
        store.id,
        body.message,
        body.sender,
        body.type
      );
      set.status = response.code;
      return response;
    },
    {
      body: t.Object({
        message: t.String(),
        sender: t.Union([t.Literal("user"), t.Literal("ai")]),
        type: t.Optional(
          t.Union([
            t.Literal("text"),
            t.Literal("suggestion"),
            t.Literal("image"),
          ])
        ),
      }),
    }
  )

  // Update session
  .patch(
    "/session/:sessionId",
    async ({ store, params, body, set }) => {
      const response = await update_session(
        store.id,
        Number(params.sessionId),
        body.title
      );
      set.status = response.code;
      return response;
    },
    {
      body: t.Object({
        title: t.String(),
      }),
    }
  )

  // Delete session
  .delete("/session/:sessionId", async ({ store, params, set }) => {
    const response = await delete_session(store.id, Number(params.sessionId));
    set.status = response.code;
    return response;
  })

  // Get AI response
  .post("/generate", async ({ body, set }) => {
    const response = await get_ai_response(body.message);
    set.status = response.code;
    return response;
  }, {
    body: t.Object({
      message: t.String(),
    }),
  });

export default ai_chat_routes;
