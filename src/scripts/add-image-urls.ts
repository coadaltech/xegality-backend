import { sql } from "drizzle-orm";
import db from "../config/db";

async function addImageUrlsColumn() {
  try {
    await db.execute(sql`ALTER TABLE ai_chat_messages ADD COLUMN IF NOT EXISTS image_urls TEXT`);
    console.log("✅ Column image_urls added successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

addImageUrlsColumn();
