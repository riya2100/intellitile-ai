import { pgTable, text, serial, numeric, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tilesTable = pgTable("tiles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sku: text("sku").notNull().unique(),
  category: text("category").notNull(),
  finish: text("finish").notNull(),
  room: text("room").notNull(),
  size: text("size").notNull(),
  pricePerSqft: numeric("price_per_sqft", { precision: 10, scale: 2 }).notNull(),
  color: text("color").notNull(),
  pattern: text("pattern"),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  collection: text("collection"),
  isNew: boolean("is_new").default(false),
  isBestSeller: boolean("is_best_seller").default(false),
  rating: numeric("rating", { precision: 3, scale: 2 }).default("4.0"),
  reviewCount: integer("review_count").default(0),
  tags: text("tags").array().default([]),
  aiEmbeddingText: text("ai_embedding_text"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTileSchema = createInsertSchema(tilesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTile = z.infer<typeof insertTileSchema>;
export type Tile = typeof tilesTable.$inferSelect;
