import { Elysia } from "elysia";
import "dotenv/config";
import cors from "@elysiajs/cors";
import internship_routes from "./routes/student/internship.routes";
import web_socket from "./services/socket/ws.service";
import consumer_dashboard_routes from "./routes/consumer/dashboard.routes";
import auth_routes from "./routes/shared/auth.routes";
import consumer_core_routes from "./routes/consumer/core.routes";
import case_routes from "./routes/lawyer/dashboard.route";
import ca_dashboard_routes from "./routes/ca/dashboard.routes";

const SERVER_PORT = process.env.SERVER_PORT;
if (!SERVER_PORT) {
  throw new Error("SERVER_PORT environment variable is not set");
}

const app = new Elysia({ prefix: "/api" })
  .use(cors({ origin: process.env.FRONTEND_URL, credentials: true, }))
  .use(auth_routes)
  .use(internship_routes)
  .use(consumer_dashboard_routes)
  .use(consumer_core_routes)
  .use(web_socket)
  .use(case_routes)
  .use(consumer_core_routes)
  .use(ca_dashboard_routes)
  .listen(SERVER_PORT);

console.log(`[SERVER] -> http://localhost:${app.server?.port}`);
