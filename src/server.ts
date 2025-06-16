import { Elysia } from "elysia";
import "dotenv/config";
import auth_routes from "./routes/auth.routes";
import cors from "@elysiajs/cors";
import { authenticate_jwt } from "./middlewares";
import { JWTUser } from "./types/auth.types";

const SERVER_PORT = process.env.SERVER_PORT;
if (!SERVER_PORT) {
  throw new Error("SERVER_PORT environment variable is not set");
}

const JWT_SECRET = process.env.ACCESS_KEY || "heymama";

// Main app
const app = new Elysia({ prefix: "/api" })
  .use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
    })
  )

  // Public routes (auth only)
  .use(auth_routes)

  // Protected routes (JWT required)
  .guard(
    {
      beforeHandle({ headers, set }) {
        console.log(headers);
        let access_token = headers.authorization
        console.log(access_token);
        if (!access_token) {
          return {
            success: false,
            code: 404,
            message: "No Access Token Found",
          };
        }
        if (access_token.startsWith("Bearer ")) {
          access_token.replace("Bearer ", "");
        }
        const middleware_resposne = authenticate_jwt(access_token);
        if (!middleware_resposne.data) {
          set.status = middleware_resposne.code;
        }
        return middleware_resposne;
      },
    },
    (app) =>
      app
        .get("/", ({ store }: { store: { user: JWTUser } }) => ({
          message: "Welcome to the protected home route",
          user: store.user,
        }))
        .get("/home", ({ store }: { store: { user: JWTUser } }) => ({
          message: "Profile route",
          user: store.user,
        }))
  )

  .listen(SERVER_PORT);

console.log(`🚀 Elysia is running at http://localhost:${app.server?.port}`);
