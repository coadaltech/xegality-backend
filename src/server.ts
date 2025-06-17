import { Elysia } from "elysia";
import "dotenv/config";
import cors from "@elysiajs/cors";
import private_routes from "./routes/private.routes";
import public_routes from "./routes/public.routes";

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
  .use(public_routes)
  .use(private_routes)
  .listen(SERVER_PORT);

console.log(`[SERVER]   at http://localhost:${app.server?.port}`);
