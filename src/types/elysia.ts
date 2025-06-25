import { Cookie } from "elysia";

interface ElysiaMiddlewareType {
  cookie: Record<string, Cookie<string | undefined>>;
  headers: Record<string, string | undefined>;
}

export { ElysiaMiddlewareType };
