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
import lawyer_core_routes from "./routes/lawyer/core.route";
import student_core_routes from "./routes/student/core.route";
import shared_routes from "./routes/shared/connections.route";
import chat_routes from "./routes/shared/chat.routes";
import user_routes from "./routes/shared/user.routes";
import lawyer_internship_routes from "./routes/lawyer/internship.routes";
import appointment_routes from "./routes/lawyer/appointments.routes";
import internship_applications_routes from "./routes/lawyer/internship-applications.routes";
import role_management_routes from "./routes/lawyer/role-management.routes";
import research_routes from "./routes/shared/research.routes";
import payment_routes from "./routes/shared/payment.routes";

const SERVER_PORT = process.env.SERVER_PORT;
if (!SERVER_PORT) {
  throw new Error("SERVER_PORT environment variable is not set");
}

const app = new Elysia({ prefix: "/api" })
  .use(cors({ origin: process.env.FRONTEND_URL, credentials: true, }))
  .use(auth_routes)
  .use(user_routes)
  .use(consumer_core_routes)
  .use(lawyer_core_routes)
  .use(student_core_routes)
  .use(consumer_dashboard_routes)
  .use(shared_routes)
  .use(ca_dashboard_routes)
  .use(internship_routes)
  .use(lawyer_internship_routes)
  .use(appointment_routes)
  .use(internship_applications_routes)
  .use(role_management_routes)
  .use(research_routes)
  .use(payment_routes)
  .use(case_routes)
  .use(chat_routes)
  .use(web_socket)
  .listen(SERVER_PORT);

console.log(`[SERVER] -> http://localhost:${app.server?.port}`);
