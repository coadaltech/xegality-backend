import { defineConfig } from 'drizzle-kit'
import "dotenv/config"

// via connection params
export default defineConfig({
  dialect: "postgresql",
  dbCredentials: {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
    user: process.env.DB_USER || "xegality",
    password: process.env.DB_PASSWORD || "xegality",
    database: process.env.DB_NAME || "xegality_db",
  },
  schema: ["./src/models/*"]
})

