import { Elysia } from "elysia";
import "dotenv/config";
import cors from "@elysiajs/cors";

const SERVER_PORT = process.env.SERVER_PORT;
if (!SERVER_PORT) {
  throw new Error("SERVER_PORT environment variable is not set");
}

const app = new Elysia({ prefix: "/api" })
  .all("/", "Welcome to xegality!")
  .use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
    })
  )
  .listen(SERVER_PORT);

console.log(`Elysia is running at ${app.server?.hostname}:${app.server?.port}`);

// CORS SETUP COMPLETED