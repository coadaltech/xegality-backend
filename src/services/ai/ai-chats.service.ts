import { eq, and, desc } from "drizzle-orm";
import db from "@/config/db";
import {
  ai_chat_session_model,
  ai_chat_message_model,
} from "@/models/ai/ai-chats.model";

export const create_session = async (user_id: number, title?: string) => {
  try {
    const session = await db
      .insert(ai_chat_session_model)
      .values({ user_id, title: title || "New Chat" })
      .returning();

    return {
      success: true,
      code: 201,
      message: "Session created successfully",
      data: session[0],
    };
  } catch (error) {
    return {
      success: false,
      code: 500,
      message: "Failed to create session",
    };
  }
};

export const get_user_sessions = async (user_id: number) => {
  try {
    const sessions = await db
      .select()
      .from(ai_chat_session_model)
      .where(eq(ai_chat_session_model.user_id, user_id))
      .orderBy(desc(ai_chat_session_model.created_at));

    return {
      success: true,
      code: 200,
      message: "Sessions fetched successfully",
      data: sessions,
    };
  } catch (error) {
    return {
      success: false,
      code: 500,
      message: "Failed to fetch sessions",
    };
  }
};

export const get_session_messages = async (
  user_id: number,
  session_id: number
) => {
  try {
    const session = await db
      .select()
      .from(ai_chat_session_model)
      .where(
        and(
          eq(ai_chat_session_model.id, session_id),
          eq(ai_chat_session_model.user_id, user_id)
        )
      )
      .limit(1);

    if (!session.length) {
      return {
        success: false,
        code: 404,
        message: "Session not found",
      };
    }

    const messages = await db
      .select()
      .from(ai_chat_message_model)
      .where(eq(ai_chat_message_model.session_id, session_id))
      .orderBy(ai_chat_message_model.timestamp);

    return {
      success: true,
      code: 200,
      message: "Messages fetched successfully",
      data: messages,
    };
  } catch (error) {
    return {
      success: false,
      code: 500,
      message: "Failed to fetch messages",
    };
  }
};

export const send_message = async (
  session_id: number,
  user_id: number,
  message: string,
  sender: "user" | "ai",
  type?: "text" | "suggestion" | "image"
) => {
  try {
    const session = await db
      .select()
      .from(ai_chat_session_model)
      .where(
        and(
          eq(ai_chat_session_model.id, session_id),
          eq(ai_chat_session_model.user_id, user_id)
        )
      )
      .limit(1);

    if (!session.length) {
      return {
        success: false,
        code: 404,
        message: "Session not found",
      };
    }

    const newMessage = await db
      .insert(ai_chat_message_model)
      .values({ session_id, message, sender, type: type || "text" })
      .returning();

    await db
      .update(ai_chat_session_model)
      .set({ updated_at: new Date() })
      .where(eq(ai_chat_session_model.id, session_id));

    return {
      success: true,
      code: 201,
      message: "Message sent successfully",
      data: newMessage[0],
    };
  } catch (error) {
    return {
      success: false,
      code: 500,
      message: "Failed to send message",
    };
  }
};

export const get_ai_response = async (user_input: string) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        code: 500,
        message: "AI API key not configured",
      };
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: user_input }] }],
        }),
      }
    );

    console.log("response", response);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        code: response.status,
        message:
          response.status === 429
            ? "Rate limit exceeded. Please try again later."
            : "Failed to get AI response",
        data: {
          response:
            "⚠️ API rate limit exceeded. Please wait a moment and try again.",
        },
      };
    }

    const data = await response.json();
    const aiText =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";

    return {
      success: true,
      code: 200,
      message: "AI response generated",
      data: { response: aiText },
    };
  } catch (error) {
    return {
      success: false,
      code: 500,
      message: "Error getting AI response",
      data: { response: "⚠️ Technical error. Please try again." },
    };
  }
};

export const update_session = async (
  user_id: number,
  session_id: number,
  title: string
) => {
  try {
    const result = await db
      .update(ai_chat_session_model)
      .set({ title, updated_at: new Date() })
      .where(
        and(
          eq(ai_chat_session_model.id, session_id),
          eq(ai_chat_session_model.user_id, user_id)
        )
      )
      .returning();

    if (!result.length) {
      return {
        success: false,
        code: 404,
        message: "Session not found",
      };
    }

    return {
      success: true,
      code: 200,
      message: "Session updated successfully",
      data: result[0],
    };
  } catch (error) {
    return {
      success: false,
      code: 500,
      message: "Failed to update session",
    };
  }
};

export const delete_session = async (user_id: number, session_id: number) => {
  try {
    const result = await db
      .delete(ai_chat_session_model)
      .where(
        and(
          eq(ai_chat_session_model.id, session_id),
          eq(ai_chat_session_model.user_id, user_id)
        )
      )
      .returning();

    if (!result.length) {
      return {
        success: false,
        code: 404,
        message: "Session not found",
      };
    }

    return {
      success: true,
      code: 200,
      message: "Session deleted successfully",
    };
  } catch (error) {
    return {
      success: false,
      code: 500,
      message: "Failed to delete session",
    };
  }
};
