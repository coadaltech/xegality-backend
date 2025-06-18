import { Elysia } from "elysia";
import "dotenv/config";
import cors from "@elysiajs/cors";
import app_routes from "./routes/app.routes";
import auth_routes from "./routes/auth.routes";

const SERVER_PORT = process.env.SERVER_PORT;
if (!SERVER_PORT) {
  throw new Error("SERVER_PORT environment variable is not set");
}

const app = new Elysia({ prefix: "/api" })
  .use(
    cors({
      origin: process.env.FRONTEND_URL,
      credentials: true,
    })
  )
  .use(auth_routes)
  .use(app_routes)
  .listen(SERVER_PORT);

console.log(`[SERVER]   http://localhost:${app.server?.port}`);
