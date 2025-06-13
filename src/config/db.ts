import { drizzle } from 'drizzle-orm/postgres-js';
import 'dotenv/config';
import postgres from 'postgres';

const db_connect = () => {
  try {
    if (!process.env.DB_HOST && !process.env.DB_PORT && !process.env.DB_NAME && !process.env.DB_USER && !process.env.DB_PASSWORD) {
      console.warn("WARNING: DB_HOST & PORT environment variables are not defined, continuing with default values. (localhost & 5432)");
    }
    const client = postgres({
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      username: process.env.DB_USER,
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
      password: process.env.DB_PASSWORD,
      debug: function(_, query) {
        console.log("[DATABASE] EXECUTED QUERY:", query);
      },
    });

    // console.log("process.env.DB_URL", process.env.DB_HOST);
    const db = drizzle({ client: client });
    console.log("[DATABASE] db connection established successfully ✔️");
    return db
  }
  catch (error) {
    console.error(error);
    process.exit(1);
  }
}
const db = db_connect()

export default db;
