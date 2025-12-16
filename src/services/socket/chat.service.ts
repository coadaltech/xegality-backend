import { and, or, eq, asc, desc } from "drizzle-orm";
import db from "../../config/db";
import {
  InsertMessageType,
  messages_model,
  MessageType,
} from "../../models/shared/chat.model";
import { media_model } from "../../models/shared/docs.model";

const store_massage = async (chat: InsertMessageType) => {
  try {
    await db.insert(messages_model).values(chat);

    return {
      success: true,
      code: 200,
      message: "[SERVER.SOCKET] Message stored successfully",
    };
  } catch (error) {
    return {
      success: false,
      code: 500,
      message: "[SERVER.SOCKET] Error storing message:",
    };
  }
};

const get_chat_history = async (
  from: number,
  to: number,
  limit: number = 20,
  offset: number = 0
) => {
  try {
    // Get total count for pagination info
    const total_count_result = await db
      .select({ count: messages_model.id })
      .from(messages_model)
      .where(
        or(
          and(eq(messages_model.from, from), eq(messages_model.to, to)),
          and(eq(messages_model.from, to), eq(messages_model.to, from))
        )
      );

    const total_count = total_count_result.length;

    // Get messages with media information
    const db_results = await db
      .select({
        id: messages_model.id,
        from: messages_model.from,
        to: messages_model.to,
        content: messages_model.content,
        media_id: messages_model.media_id,
        seen: messages_model.seen,
        seen_at: messages_model.seen_at,
        created_at: messages_model.created_at,
        media_url: media_model.url,
        media_title: media_model.title,
        media_type: media_model.type,
        media_size: media_model.size,
      })
      .from(messages_model)
      .leftJoin(media_model, eq(messages_model.media_id, media_model.id))
      .where(
        or(
          and(eq(messages_model.from, from), eq(messages_model.to, to)),
          and(eq(messages_model.from, to), eq(messages_model.to, from))
        )
      )
      .orderBy(asc(messages_model.created_at))
      .limit(limit)
      .offset(offset);

    const has_more = offset + limit < total_count;

    if (db_results.length === 0) {
      return {
        success: false,
        code: 404,
        message: "[SERVER.SOCKET] No chat history found",
        data: {
          current_user_id: from,
          messages: [],
          pagination: {
            total_count: 0,
            has_more: false,
            current_offset: offset,
            limit: limit,
          },
        },
      };
    }

    // Transform the data to include file information
    console.log(
      `[DEBUG] Raw DB results:`,
      db_results.map((msg) => ({
        id: msg.id,
        from: msg.from,
        to: msg.to,
        seen: msg.seen,
        seen_at: msg.seen_at,
        content: msg.content?.substring(0, 20) + "...",
      }))
    );

    const transformed_messages = db_results.map((msg) => {
      const message: any = {
        id: msg.id,
        from: msg.from,
        to: msg.to,
        content: msg.content,
        media_id: msg.media_id,
        seen: msg.seen,
        seen_at: msg.seen_at,
        created_at: msg.created_at,
      };

      // Add file information if media exists
      if (msg.media_id && msg.media_url) {
        message.file_url = msg.media_url;
        message.file_name = msg.media_title;
        message.file_type = msg.media_type;
        message.file_size = msg.media_size;

        // Determine message type for frontend
        if (msg.media_type && msg.media_type.startsWith("image/")) {
          message.type = "image";
        } else {
          message.type = "file";
        }
      } else {
        message.type = "text";
      }

      return message;
    });

    return {
      success: true,
      code: 200,
      message: "[SERVER.SOCKET] Chat history successfully fetched",
      data: {
        current_user_id: from,
        messages: transformed_messages,
        pagination: {
          total_count,
          has_more,
          current_offset: offset,
          limit: limit,
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      code: 500,
      message: "[SERVER.SOCKET] Error fetching chat history",
    };
  }
};

const mark_messages_as_read = async (from: number, to: number) => {
  try {
    console.log(`[DEBUG] Marking messages as read: from=${from}, to=${to}`);

    // Mark all unread messages from 'to' to 'from' as read
    await db
      .update(messages_model)
      .set({
        seen: true,
        seen_at: new Date(),
      })
      .where(
        and(
          eq(messages_model.from, to),
          eq(messages_model.to, from),
          eq(messages_model.seen, false)
        )
      );

    console.log(`[DEBUG] Messages marked as read successfully`);

    return {
      success: true,
      code: 200,
      message: "[SERVER.SOCKET] Messages marked as read",
    };
  } catch (error) {
    console.error("[DEBUG] Error marking messages as read:", error);
    return {
      success: false,
      code: 500,
      message: "[SERVER.SOCKET] Error marking messages as read",
    };
  }
};

export { store_massage, get_chat_history, mark_messages_as_read };
