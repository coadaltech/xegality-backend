import { sql } from "drizzle-orm";
import db from "../config/db";

async function addDocumentUrls() {
  try {
    await db.execute(sql`ALTER TABLE ai_chat_messages ADD COLUMN IF NOT EXISTS document_urls TEXT`);
    console.log("✅ document_urls column added successfully");
  } catch (error) {
    console.error("❌ Migration failed:", error);
  }
  process.exit(0);
}

addDocumentUrls();
