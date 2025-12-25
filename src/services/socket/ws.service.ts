import { Elysia, t } from "elysia";
import { authenticate_jwt } from "../../middlewares";
import { store_massage, mark_messages_as_read } from "./chat.service";

// const active_sockets = new Map<string, string[]>();
// if (!active_sockets.has(user_id)) {
//   active_sockets.set(user_id, []);
// }
// active_sockets.get(user_id)?.push(ws.id)

const private_channels: string[] = [];

const fetch_info = (token: string, receiver_id: number) => {
  const auth_result = authenticate_jwt(token);
  if (!auth_result.success) {
    return { success: false, code: 1009, message: auth_result.message };
  }

  // put empty array if not exists
  if (!auth_result.data?.id || !auth_result.data?.role) {
    return { success: false, code: 1011, message: "Invalid user data" };
  }

  const user_id = auth_result.data?.id;
  const user_role = auth_result.data?.role;

  return {
    success: true,
    user_id,
    user_role,
  };
};

const web_socket = new Elysia()
  .ws("/chat", {
    // on connection request
    open: (ws) => {
      const sender_id = new URL(ws.data.request.url).searchParams.get("from");
      const role = new URL(ws.data.request.url).searchParams.get("role");
      const receiver_id = Number(
        new URL(ws.data.request.url).searchParams.get("to")
      );

      if (!sender_id || !role || !receiver_id) {
        ws.close(1008, "Missing from (id) or role or receiver");
        return;
      }

      const user_id = Number(sender_id);
      const user_role = role;

      const channel = `${user_id}:${receiver_id}`;
      const channel_r = `${receiver_id}:${user_id}`;

      if (private_channels.includes(channel)) {
        ws.subscribe(channel!);
      } else if (private_channels.includes(channel_r)) {
        ws.subscribe(channel_r);
      } else {
        private_channels.push(channel);
        ws.subscribe(channel);
      }
    },

    // drain: (ws) => {
    //   console.log("drain", ws.id);
    // },

    // on message received
    message: async (ws, message) => {
      const sender_id = new URL(ws.data.request.url).searchParams.get("from");
      const role = new URL(ws.data.request.url).searchParams.get("role");
      const receiver_id = Number(
        new URL(ws.data.request.url).searchParams.get("to")
      );

      if (!sender_id || !role || !receiver_id) {
        ws.close(1008, "Missing from (id) or role or receiver");
        return;
      }

      const user_id = Number(sender_id);
      const user_role = role;

      const channel = `${user_id}:${receiver_id}`;
      const channel_r = `${receiver_id}:${user_id}`;

      // Handle read receipt messages
      if (message.type === "read_receipt") {
        console.log(`[DEBUG] Received read_receipt message:`, message);
        console.log(`[DEBUG] user_id: ${user_id}, receiver_id: ${receiver_id}`);
        console.log(`[DEBUG] Available channels:`, private_channels);
        console.log(`[DEBUG] Checking channels: ${channel}, ${channel_r}`);

        const markResult = await mark_messages_as_read(user_id, receiver_id);
        console.log(`[DEBUG] markResult:`, markResult);

        if (markResult.success) {
          // Broadcast read receipt to the other user
          const readReceiptMessage = {
            type: "read_receipt",
            from: user_id,
            to: receiver_id,
            timestamp: new Date().toISOString(),
          };

          console.log(`[DEBUG] Broadcasting read receipt:`, readReceiptMessage);

          let broadcasted = false;
          if (private_channels.includes(channel)) {
            ws.publish(channel, JSON.stringify(readReceiptMessage));
            console.log(`[DEBUG] Published to channel: ${channel}`);
            broadcasted = true;
          } else if (private_channels.includes(channel_r)) {
            ws.publish(channel_r, JSON.stringify(readReceiptMessage));
            console.log(`[DEBUG] Published to channel_r: ${channel_r}`);
            broadcasted = true;
          } else {
            console.log(`[DEBUG] No channel found for broadcasting`);
          }

          console.log(`[DEBUG] Broadcast successful: ${broadcasted}`);
        } else {
          console.log(`[DEBUG] Failed to mark messages as read`);
        }
        return;
      }

      let shouldStore = true;
      let messageContent = message.message;

      if (message.type && message.file_url) {
        shouldStore = false;
      }

      let storing_results;
      if (shouldStore) {
        storing_results = await store_massage({
          from: Number(user_id),
          to: Number(receiver_id),
          content: messageContent,
          created_at: new Date(),
        });

        if (!storing_results.success) {
          ws.send(storing_results.message);
          return;
        }
      } else {
        storing_results = { success: true };
      }

      // Broadcast the complete message with file URL and type
      if (private_channels.includes(channel)) {
        ws.publish(channel, JSON.stringify(message));
      } else if (private_channels.includes(channel_r)) {
        ws.publish(channel_r, JSON.stringify(message));
      } else {
        ws.send("either channel not found or not subscribed");
      }
    },

    // on close connection
    close: (ws, error, message) => {
      const sender_id = new URL(ws.data.request.url).searchParams.get("from");
      const role = new URL(ws.data.request.url).searchParams.get("role");
      const receiver_id = Number(
        new URL(ws.data.request.url).searchParams.get("to")
      );

      if (!sender_id || !role || !receiver_id) {
        ws.close(1008, "Missing from (id) or role or receiver");
        return;
      }

      const user_id = Number(sender_id);
      const user_role = role;

      const channel = `${user_id}:${receiver_id}`;
      const channel_r = `${receiver_id}:${user_id}`;

      if (private_channels.includes(channel)) {
        ws.unsubscribe(channel);
      } else if (private_channels.includes(channel_r)) {
        ws.unsubscribe(channel_r);
      } else {
        ws.send("either channel not found or not subscribed");
      }
    },

    // body: t.String()
    body: t.Object({
      message: t.Optional(t.String()),
      type: t.Optional(
        t.Union([
          t.Literal("text"),
          t.Literal("image"),
          t.Literal("file"),
          t.Literal("read_receipt"),
        ])
      ),
      file_url: t.Optional(t.String()),
      file_name: t.Optional(t.String()),
      file_size: t.Optional(t.String()),
      // Allow from and to for read receipt messages
      from: t.Optional(t.String()),
      to: t.Optional(t.String()),
      timestamp: t.Optional(t.String()),
    }),
  })
  .listen(4001);

console.log(`[WEBSOCKET] -> ws://localhost:${web_socket.server?.port}/chat`);

export default web_socket;
