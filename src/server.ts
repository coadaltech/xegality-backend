import { Elysia } from "elysia";
import "dotenv/config";
import cors from "@elysiajs/cors";
import app_routes from "./routes/internship.routes";
import auth_routes from "./routes/auth.routes";
import internship_routes from "./routes/internship.routes";
import web_socket from "./services/socket/ws.service";
import consumer_dashboard_routes from "./routes/consumer/dashboard.routes";

const SERVER_PORT = process.env.SERVER_PORT;
if (!SERVER_PORT) {
  throw new Error("SERVER_PORT environment variable is not set");
}

const app = new Elysia({ prefix: "/api" })
  .use(cors({ origin: process.env.FRONTEND_URL, credentials: true, }))
  .use(auth_routes)
  .use(internship_routes)
  .use(app_routes)
  .use(consumer_dashboard_routes)
  .use(web_socket)
  .listen(SERVER_PORT);

console.log(`[SERVER] -> http://localhost:${app.server?.port}`);
