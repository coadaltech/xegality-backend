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
import google_calendar_routes from "./routes/lawyer/google-calendar.routes";
import internship_applications_routes from "./routes/lawyer/internship-applications.routes";
import role_management_routes from "./routes/lawyer/role-management.routes";
import research_routes from "./routes/shared/research.routes";
import payment_routes from "./routes/shared/payment.routes";
import blog_routes from "./routes/promotions/blogs.routes";
import static_routes from "./routes/shared/static.routes";
import contact_routes from "./routes/shared/contact.routes";
import { subscriptionRoutes } from "./routes/shared/subscription.routes";
import { adminSubscriptionRoutes } from "./routes/admin/subscription.routes";
import { adminUsersRoutes } from "./routes/admin/users.routes";
import { uploadRoutes } from "./routes/shared/upload.routes";
import ai_chat_routes from "./routes/ai/ai-chats.routes";

const SERVER_PORT = process.env.SERVER_PORT;
const FRONTEND_URL = process.env.FRONTEND_URL;
if (!SERVER_PORT || !FRONTEND_URL) {
  throw new Error("SERVER_PORT environment variable is not set");
}


const app = new Elysia({
  serve: {
    idleTimeout: 60
  }
})
  .use(cors({
    origin: [FRONTEND_URL, "main.dctpgzcrrs0wn.amplifyapp.com"],
    credentials: true
  }))
  .use(static_routes)
  .group("/api", (app) =>
    app
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
      .use(google_calendar_routes)
      .use(internship_applications_routes)
      .use(role_management_routes)
      .use(research_routes)
      .use(payment_routes)
      .use(subscriptionRoutes)
      .use(adminSubscriptionRoutes)
      .use(adminUsersRoutes)
      .use(blog_routes)
      .use(contact_routes)
      .use(case_routes)
      .use(chat_routes)
      .use(uploadRoutes)
      .use(ai_chat_routes)
      .use(web_socket)
  )
  .get("/", () => {
    return "Welcome to Xegality Backend";
  })
  .listen(SERVER_PORT);

console.log(`[SERVER] -> http://localhost:${app.server?.port}`);
