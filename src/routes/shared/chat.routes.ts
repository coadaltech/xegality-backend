import { Elysia, t } from "elysia";
import { app_middleware } from "../../middlewares";
import {
  get_chat_history,
  mark_messages_as_read,
} from "@/services/socket/chat.service";
import { upload_chat_file } from "@/services/shared/media.service";
import { messages_model } from "@/models/shared/chat.model";
import db from "../../config/db";
import { eq } from "drizzle-orm";

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const chat_routes = new Elysia({ prefix: "/chat" })
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

  .get(
    "/fetch-chat-history/:id",
    async ({ set, store, params, query }) => {
      const limit = query.limit ? parseInt(query.limit) : 20;
      const offset = query.offset ? parseInt(query.offset) : 0;

      const chat_history = await get_chat_history(
        store.id,
        params.id,
        limit,
        offset
      );

      set.status = chat_history.code;
      return chat_history;
    },
    {
      params: t.Object({
        id: t.Number(),
      }),
      query: t.Object({
        limit: t.Optional(t.String()),
        offset: t.Optional(t.String()),
      }),
    }
  )

  .post(
    "/mark-as-read",
    async ({ set, store, body }) => {
      const { recipientId } = body;

      const result = await mark_messages_as_read(
        store.id,
        parseInt(recipientId)
      );

      set.status = result.code;
      return result;
    },
    {
      body: t.Object({
        recipientId: t.String(),
      }),
    }
  )

  .post(
    "/send-file",
    async ({ set, store, body }) => {
      const { file, chatId, recipientId } = body;

      // Upload the file first
      const upload_result = await upload_chat_file(file, store.id, file.name);

      if (!upload_result.success || !upload_result.data) {
        set.status = upload_result.code;
        return upload_result;
      }

      // Create message with media reference
      try {
        const [message] = await db
          .insert(messages_model)
          .values({
            from: store.id,
            to: parseInt(recipientId),
            media_id: upload_result.data.id,
            content: null, // No text content for file messages
          })
          .returning();

        // Determine file type for frontend
        const fileType = file.type.startsWith("image/") ? "image" : "document";

        return {
          code: 200,
          success: true,
          data: {
            id: message.id,
            fileName: upload_result.data.title,
            fileSize: formatFileSize(upload_result.data.size),
            fileUrl: upload_result.data.url,
            fileType: fileType,
          },
        };
      } catch (error) {
        console.error("Error creating file message:", error);
        set.status = 500;
        return {
          code: 500,
          success: false,
          message: "Failed to send file message",
        };
      }
    },
    {
      body: t.Object({
        file: t.File(),
        chatId: t.String(),
        recipientId: t.String(),
      }),
    }
  );

export default chat_routes;
