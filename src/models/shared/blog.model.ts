import { pgTable, serial, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const blogs = pgTable("blogs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull(),
  image: text("image").notNull(),
  category: text("category").notNull(),
  author: text("author").notNull(),
  keywords: jsonb("keywords").$type<string[]>().default([]),
  sections: jsonb("sections").$type<Array<{
    heading: string;
    paragraphs: string[];
    images: string[];
  }>>().default([]),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});
