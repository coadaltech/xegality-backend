import Elysia from "elysia";
import { readFileSync, existsSync } from "fs";

const static_routes = new Elysia()
  .get("/uploads/*", ({ params }) => {
    const filepath = `./uploads/${params['*']}`;
    
    if (!existsSync(filepath)) {
      return new Response("File not found", { status: 404 });
    }
    
    const file = Bun.file(filepath);
    return file;
  });

export default static_routes;
