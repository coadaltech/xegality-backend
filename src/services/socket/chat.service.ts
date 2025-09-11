import { and, or, eq, asc, desc } from "drizzle-orm";
import db from "../../config/db";
import { InsertMessageType, messages_model, MessageType } from "../../models/shared/chat.model";

const store_massage = async (chat: InsertMessageType) => {
  try {

    await db.insert(messages_model).values(chat);

    return {
      success: true,
      code: 200,
      message: "[SERVER.SOCKET] Message stored successfully",
    };

  }
  catch (error) {
    return {
      success: false,
      code: 500,
      message: "[SERVER.SOCKET] Error storing message:",
    };
  }
}

const get_chat_history = async (from: number, to: number, limit: number = 20, offset: number = 0) => {
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
    
    // Simple approach: get messages in chronological order with offset
    const db_results = await db
      .select()
      .from(messages_model)
      .where(
        or(
          and(eq(messages_model.from, from), eq(messages_model.to, to)),
          and(eq(messages_model.from, to), eq(messages_model.to, from))
        )
      )
      .orderBy(asc(messages_model.created_at))
      .limit(limit)
      .offset(offset);

    const has_more = (offset + limit) < total_count;

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
            limit: limit
          }
        },
      };
    }

    return {
      success: true,
      code: 200,
      message: "[SERVER.SOCKET] Chat history successfully fetched",
      data: {
        current_user_id: from,
        messages: db_results as MessageType[],
        pagination: {
          total_count,
          has_more,
          current_offset: offset,
          limit: limit
        }
      },
    };

  }
  catch (error) {
    return {
      success: false,
      code: 500,
      message: "[SERVER.SOCKET] Error fetching chat history",
    };
  }

}

export { store_massage, get_chat_history };
