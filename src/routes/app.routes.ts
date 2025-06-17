import { Elysia } from "elysia";
import { JWTUser } from "../types/auth.types";
import { authenticate_jwt } from "../middlewares";

const app_routes = new Elysia({ prefix: "/app" }).guard(
  {
    beforeHandle({ cookie, set }) {
      let access_token = String(cookie.access_token);
      if (!access_token) {
        return {
          success: false,
          code: 404,
          message: "No Access Token in Cookies",
        };
      }
      if (access_token.startsWith("Bearer ")) {
        access_token.replace("Bearer ", "");
      }
      const middleware_resposne = authenticate_jwt(access_token);
      set.status = middleware_resposne.code;
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
);

export default app_routes;
