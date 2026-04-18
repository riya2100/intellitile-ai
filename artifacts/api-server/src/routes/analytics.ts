import { Router } from "express";
import { db } from "@workspace/db";
import { tilesTable, recommendationEvents, visualizationEvents, conversations, messages } from "@workspace/db";
import { sql, count, avg } from "drizzle-orm";

const router = Router();

router.get("/analytics/dashboard", async (req, res) => {
  try {
    const [
      tileCount,
      recommendationCount,
      visualizationCount,
      conversationCount,
      avgRatingResult,
      categoryResult,
      newArrivalsResult,
    ] = await Promise.all([
      db.select({ count: count() }).from(tilesTable),
      db.select({ count: count() }).from(recommendationEvents),
      db.select({ count: count() }).from(visualizationEvents),
      db.select({ count: count() }).from(conversations),
      db.select({ avg: avg(tilesTable.rating) }).from(tilesTable),
      db
        .select({ category: tilesTable.category, count: count() })
        .from(tilesTable)
        .groupBy(tilesTable.category)
        .orderBy(sql`count(*) DESC`)
        .limit(1),
      db.select({ count: count() }).from(tilesTable).where(sql`is_new = true`),
    ]);

    const distinctCategories = await db
      .selectDistinct({ category: tilesTable.category })
      .from(tilesTable);

    res.json({
      totalTiles: Number(tileCount[0]?.count ?? 0),
      totalCategories: distinctCategories.length,
      totalRecommendations: Number(recommendationCount[0]?.count ?? 0),
      totalVisualizations: Number(visualizationCount[0]?.count ?? 0),
      totalConversations: Number(conversationCount[0]?.count ?? 0),
      avgRating: Number(Number(avgRatingResult[0]?.avg ?? 4.2).toFixed(2)),
      topCategory: categoryResult[0]?.category ?? "ceramic_floor",
      newArrivalsCount: Number(newArrivalsResult[0]?.count ?? 0),
    });
  } catch (err) {
    req.log.error({ err }, "Error getting dashboard stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/analytics/popular-rooms", async (req, res) => {
  try {
    const roomCounts = await db
      .select({ room: tilesTable.room, count: count() })
      .from(tilesTable)
      .groupBy(tilesTable.room)
      .orderBy(sql`count(*) DESC`);

    const total = roomCounts.reduce((sum, r) => sum + Number(r.count), 0);

    const result = roomCounts.map((r) => ({
      room: r.room,
      count: Number(r.count),
      percentage: total > 0 ? Math.round((Number(r.count) / total) * 100) : 0,
    }));

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Error getting popular rooms");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/analytics/design-trends", async (req, res) => {
  try {
    const finishTrends = await db
      .select({ finish: tilesTable.finish, count: count() })
      .from(tilesTable)
      .groupBy(tilesTable.finish)
      .orderBy(sql`count(*) DESC`)
      .limit(3);

    const trendMap: Record<string, { trend: string; description: string; score: number }> = {
      matte: {
        trend: "Matte Revolution",
        description: "Matte finish tiles are dominating 2024-25 with their sophisticated, anti-glare properties perfect for modern Indian homes",
        score: 9.2,
      },
      glossy: {
        trend: "High-Gloss Glamour",
        description: "Glossy tiles continue to drive premium segment growth, especially in bathroom and feature wall applications",
        score: 8.7,
      },
      textured: {
        trend: "Tactile Textures",
        description: "Anti-skid textured tiles are rising rapidly in outdoor and wet area applications driven by safety consciousness",
        score: 8.1,
      },
      rustic: {
        trend: "Rustic Revival",
        description: "Rustic finish tiles bring warmth and organic character, aligning with the biophilic design movement",
        score: 7.8,
      },
      satin: {
        trend: "Satin Sophistication",
        description: "Satin finish bridges matte and gloss — a versatile choice gaining traction in living rooms and bedrooms",
        score: 7.5,
      },
    };

    const trends = finishTrends.map((f) => {
      const info = trendMap[f.finish] ?? {
        trend: `${f.finish} Finish Trend`,
        description: `${f.finish} finish tiles show strong catalog presence with growing customer interest`,
        score: 7.0,
      };
      return {
        ...info,
        exampleTileIds: [],
      };
    });

    if (trends.length < 3) {
      trends.push({
        trend: "Large Format Slabs",
        description: "1200x2400mm large slabs are redefining premium spaces — fewer grout lines, seamless aesthetics",
        score: 9.5,
        exampleTileIds: [],
      });
    }

    res.json(trends);
  } catch (err) {
    req.log.error({ err }, "Error getting design trends");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
