import { pgTable, serial, text, integer, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const recommendationEvents = pgTable("recommendation_events", {
  id: serial("id").primaryKey(),
  query: text("query").notNull(),
  roomType: text("room_type"),
  styleProfile: text("style_profile"),
  tileIdsReturned: integer("tile_ids_returned").array().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const visualizationEvents = pgTable("visualization_events", {
  id: serial("id").primaryKey(),
  tileId: integer("tile_id"),
  roomType: text("room_type"),
  eventType: text("event_type").notNull().default("room"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertRecommendationEventSchema = createInsertSchema(recommendationEvents).omit({ id: true, createdAt: true });
export const insertVisualizationEventSchema = createInsertSchema(visualizationEvents).omit({ id: true, createdAt: true });

export type RecommendationEvent = typeof recommendationEvents.$inferSelect;
export type VisualizationEvent = typeof visualizationEvents.$inferSelect;
export type InsertRecommendationEvent = z.infer<typeof insertRecommendationEventSchema>;
export type InsertVisualizationEvent = z.infer<typeof insertVisualizationEventSchema>;
