import db from "../../config/db";
import { messages_model } from "../../models/shared/chat.model";

interface ChatMessage {
  from: number;
  to: number;
  content: string;
  attachment_url?: string;
  attachment_type?: string;
  seen?: boolean;
  created_at: Date;
}
const store_massage = async ({ from, to, content, attachment_url, attachment_type, seen, created_at }: ChatMessage) => {
  try {

    await db.insert(messages_model).values({
      from,
      to,
      content,
      attachment_url,
      attachment_type,
      seen,
      created_at: created_at || new Date(),
    });

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

export { store_massage };
