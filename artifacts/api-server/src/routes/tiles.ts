import { Router } from "express";
import { db } from "@workspace/db";
import { tilesTable } from "@workspace/db";
import { ListTilesQueryParams, GetTileParams, GetSimilarTilesParams, GetTrendingTilesQueryParams } from "@workspace/api-zod";
import { eq, ilike, and, gte, lte, or, ne, sql } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

router.get("/tiles", async (req, res) => {
  try {
    const query = ListTilesQueryParams.safeParse(req.query);
    if (!query.success) {
      res.status(400).json({ error: "Invalid query params" });
      return;
    }

    const { category, room, finish, priceMin, priceMax, search, page = 1, limit = 12 } = query.data;
    const offset = (page - 1) * limit;

    const conditions: ReturnType<typeof eq>[] = [];

    if (category) conditions.push(eq(tilesTable.category, category));
    if (room) conditions.push(eq(tilesTable.room, room));
    if (finish) conditions.push(eq(tilesTable.finish, finish));
    if (priceMin) conditions.push(gte(tilesTable.pricePerSqft, String(priceMin)));
    if (priceMax) conditions.push(lte(tilesTable.pricePerSqft, String(priceMax)));
    if (search) {
      conditions.push(
        or(
          ilike(tilesTable.name, `%${search}%`),
          ilike(tilesTable.description, `%${search}%`),
          ilike(tilesTable.color, `%${search}%`),
          ilike(tilesTable.collection, `%${search}%`),
          ilike(tilesTable.aiEmbeddingText, `%${search}%`)
        ) as ReturnType<typeof eq>
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [tiles, countResult] = await Promise.all([
      db.select().from(tilesTable).where(whereClause).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(tilesTable).where(whereClause),
    ]);

    const total = Number(countResult[0]?.count ?? 0);
    const totalPages = Math.ceil(total / limit);

    res.json({
      tiles: tiles.map(formatTile),
      total,
      page,
      totalPages,
    });
  } catch (err) {
    req.log.error({ err }, "Error listing tiles");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/tiles/trending", async (req, res) => {
  try {
    const query = GetTrendingTilesQueryParams.safeParse(req.query);
    const room = query.success ? query.data.room : undefined;

    const conditions = [];
    if (room) conditions.push(eq(tilesTable.room, room));

    const tiles = await db
      .select()
      .from(tilesTable)
      .where(
        conditions.length > 0
          ? and(
              or(eq(tilesTable.isBestSeller, true), eq(tilesTable.isNew, true)) as ReturnType<typeof eq>,
              ...conditions
            )
          : or(eq(tilesTable.isBestSeller, true), eq(tilesTable.isNew, true))
      )
      .limit(8);

    res.json(tiles.map(formatTile));
  } catch (err) {
    req.log.error({ err }, "Error getting trending tiles");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/tiles/similar/:id", async (req, res) => {
  try {
    const params = GetSimilarTilesParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: "Invalid params" });
      return;
    }

    const tile = await db.select().from(tilesTable).where(eq(tilesTable.id, params.data.id)).limit(1);
    if (!tile[0]) {
      res.status(404).json({ error: "Tile not found" });
      return;
    }

    const source = tile[0];
    const similar = await db
      .select()
      .from(tilesTable)
      .where(
        and(
          ne(tilesTable.id, source.id),
          or(
            eq(tilesTable.category, source.category),
            eq(tilesTable.room, source.room),
            eq(tilesTable.finish, source.finish)
          ) as ReturnType<typeof eq>
        )
      )
      .limit(6);

    res.json(similar.map(formatTile));
  } catch (err) {
    req.log.error({ err }, "Error getting similar tiles");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/tiles/:id", async (req, res) => {
  try {
    const params = GetTileParams.safeParse({ id: Number(req.params.id) });
    if (!params.success) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const tiles = await db.select().from(tilesTable).where(eq(tilesTable.id, params.data.id)).limit(1);
    if (!tiles[0]) {
      res.status(404).json({ error: "Tile not found" });
      return;
    }

    res.json(formatTile(tiles[0]));
  } catch (err) {
    req.log.error({ err }, "Error getting tile");
    res.status(500).json({ error: "Internal server error" });
  }
});

function formatTile(tile: typeof tilesTable.$inferSelect) {
  return {
    ...tile,
    pricePerSqft: Number(tile.pricePerSqft),
    rating: Number(tile.rating),
  };
}

export default router;
