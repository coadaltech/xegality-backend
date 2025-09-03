import { Elysia, t } from 'elysia';
import { authenticate_jwt } from '../../middlewares';
import { store_massage } from './chat.service';

// const active_sockets = new Map<string, string[]>();
// if (!active_sockets.has(user_id)) {
//   active_sockets.set(user_id, []);
// }
// active_sockets.get(user_id)?.push(ws.id)

const private_channels: string[] = []

const fetch_info = (token: string, receiver_id: number) => {

  const auth_result = authenticate_jwt(token);

  if (!auth_result.success) {
    console.log(`[WEBSOCKET] -> Authentication failed: ${auth_result.message}`);

    return { success: false, code: 1009, message: auth_result.message };
  }

  // put empty array if not exists
  if (!auth_result.data?.id || !auth_result.data?.role) {
    return { success: false, code: 1011, message: 'Invalid user data' };
  }

  const user_id = auth_result.data?.id;
  const user_role = auth_result.data?.role;

  return {
    success: true,
    user_id,
    user_role,
  }
}

const web_socket = new Elysia()
  .ws('/chat', {
    // on connection request
    open: (ws) => {
      const token = new URL(ws.data.request.url).searchParams.get('token')
      const receiver_id = Number(new URL(ws.data.request.url).searchParams.get('to'))

      if (!token || !receiver_id) {
        ws.close(1008, 'Missing token or receiver');
        return;
      }

      const fetch_info_results = fetch_info(token, receiver_id);
      if (!fetch_info_results.success) {
        ws.close(fetch_info_results.code, fetch_info_results.message);
        return;
      }

      const { user_id, user_role } = fetch_info_results;
      const channel = `${user_id}:${receiver_id}`;
      const channel_r = `${receiver_id}:${user_id}`;

      if (private_channels.includes(channel)) {
        ws.subscribe(channel!);
        console.log(`${user_role} ${user_id} connected and subscribed to: ${channel}`);
      }
      else if (private_channels.includes(channel_r)) {
        ws.subscribe(channel_r)
        console.log(`${user_role} ${user_id} connected and subscribed to: ${channel_r}`);
      }
      else {
        private_channels.push(channel)
        ws.subscribe(channel);
        console.log(`${user_role} ${user_id} connected and subscribed to: ${channel}`);
      }
    },

    // drain: (ws) => {
    //   console.log("drain", ws.id);
    // },

    // on message received
    message: async (ws, message) => {
      const token = new URL(ws.data.request.url).searchParams.get('token')
      const receiver_id = Number(new URL(ws.data.request.url).searchParams.get('to'))

      if (!token || !receiver_id) {
        ws.close(1008, 'Missing token or receiver');
        return;
      }

      const fetch_info_results = fetch_info(token, receiver_id);
      if (!fetch_info_results.success) {
        ws.close(fetch_info_results.code, fetch_info_results.message);
        return;
      }

      console.log("you don't have to do this string:string bullshit IG, just store ws for a randomly generated id and use that to send messages (just like in cricstock)");

      const { user_id, user_role } = fetch_info_results;
      const channel = `${user_id}:${receiver_id}`;
      const channel_r = `${receiver_id}:${user_id}`;

      console.log({ from: user_id, to: receiver_id, message, created_at: new Date() });
      const storing_results = await store_massage({ from: Number(user_id), to: Number(receiver_id), content: message.message, created_at: new Date() })
      if (!storing_results.success) {
        ws.send(storing_results.message);
        console.log(storing_results.message);
        return;
      }

      if (private_channels.includes(channel)) {
        ws.publish(channel, JSON.stringify(message));
      }
      else if (private_channels.includes(channel_r)) {
        ws.publish(channel_r, JSON.stringify(message))
      }
      else {
        ws.send("either channel not found or not subscribed");
      }
    },

    // on close connection
    close: (ws, error, message) => {
      const token = new URL(ws.data.request.url).searchParams.get('token')
      const receiver_id = Number(new URL(ws.data.request.url).searchParams.get('to'))

      if (!token || !receiver_id) {
        ws.close(1008, 'Missing token or receiver');
        return;
      }

      const fetch_info_results = fetch_info(token, receiver_id);
      if (!fetch_info_results.success) {
        ws.close(fetch_info_results.code, fetch_info_results.message);
        return;
      }

      const { user_id, user_role } = fetch_info_results;
      const channel = `${user_id}:${receiver_id}`;
      const channel_r = `${receiver_id}:${user_id}`;

      if (private_channels.includes(channel)) {
        ws.unsubscribe(channel);
        console.log(`${user_role} unsubscribed from `, channel);
      }
      else if (private_channels.includes(channel_r)) {
        ws.unsubscribe(channel_r)
        console.log(`${user_role} unsubscribed from `, channel_r);
      }
      else {
        ws.send("either channel not found or not subscribed");
      }

    },

    // body: t.String()
    body: t.Object({
      message: t.String()
    }),
  })
  .listen(4001)
console.log(`[WEBSOCKET] -> http://localhost:${web_socket.server?.port}`);

export default web_socket;
