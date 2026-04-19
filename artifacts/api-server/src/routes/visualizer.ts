import { Router } from "express";
import { db } from "@workspace/db";
import { tilesTable, visualizationEvents } from "@workspace/db";
import { GenerateRoomVisualizationBody, GenerateMoodBoardBody } from "@workspace/api-zod";
import { eq, inArray } from "drizzle-orm";

const router = Router();

router.post("/visualizer/generate", async (req, res) => {
  try {
    const body = GenerateRoomVisualizationBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }

    const { tileId, roomType, roomDescription } = body.data;

    const tiles = await db.select().from(tilesTable).where(eq(tilesTable.id, tileId)).limit(1);
    const tile = tiles[0];
    if (!tile) {
      res.status(404).json({ error: "Tile not found" });
      return;
    }

    const roomName = roomType.replace(/_/g, " ");
    const tileDetail = `${tile.name} (${tile.finish} finish, ${tile.color} color, ${tile.size}cm, ${tile.category})`;

    const prompt = `Concept preview for a ${roomName} using ${tileDetail}.${roomDescription ? ` ${roomDescription}` : ""}`;

    // ✅ SMART IMAGE MATCHING (FIXED)
    let imageUrl = "";

    if (roomType === "kitchen") {
      imageUrl = tile.finish?.toLowerCase().includes("glossy")
        ? "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&h=1200&fit=crop&q=80"
        : "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=1200&fit=crop&q=80";
    } 
    else if (roomType === "bathroom") {
      imageUrl = "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1200&h=1200&fit=crop&q=80";
    } 
    else if (roomType === "bedroom") {
      imageUrl = tile.pattern?.toLowerCase().includes("wood")
        ? "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&h=1200&fit=crop&q=80"
        : "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&h=1200&fit=crop&q=80";
    } 
    else if (roomType === "living_room") {
      imageUrl = tile.pattern?.toLowerCase().includes("marble")
        ? "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=1200&h=1200&fit=crop&q=80"
        : "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&h=1200&fit=crop&q=80";
    } 
    else {
      imageUrl = "https://images.unsplash.com/photo-1615529328331-f8917597711f?w=1200&h=1200&fit=crop&q=80";
    }

    await db.insert(visualizationEvents).values({
      tileId,
      roomType,
      eventType: "room",
    }).catch(() => {});

    res.json({
      imageUrl,
      prompt,
      tileDetails: tileDetail,
      demoMode: true,
      message: "Concept preview generated successfully",
    });
  } catch (err) {
    req.log.error({ err }, "Error generating visualization");
    res.status(500).json({ error: "Failed to generate visualization" });
  }
});

router.post("/visualizer/mood-board", async (req, res) => {
  try {
    const body = GenerateMoodBoardBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }

    const { style, roomType, colorPalette, tileIds } = body.data;

    let tileContext = "";
    if (tileIds && tileIds.length > 0) {
      const tiles = await db
        .select()
        .from(tilesTable)
        .where(inArray(tilesTable.id, tileIds))
        .limit(tileIds.length);

      tileContext = tiles.map((t) => `${t.name} (${t.color}, ${t.finish})`).join(", ");
    }

    const prompt = `Concept mood board for a ${style} style ${roomType.replace(/_/g, " ")}.${colorPalette ? ` Color palette: ${colorPalette}.` : ""}${tileContext ? ` Tiles: ${tileContext}.` : ""}`;

    // ✅ BETTER STYLE MATCHING
    let imageUrl = "";

    if (style === "modern") {
      imageUrl = "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&h=1200&fit=crop&q=80";
    } 
    else if (style === "rustic") {
      imageUrl = "https://images.unsplash.com/photo-1615529328331-f8917597711f?w=1200&h=1200&fit=crop&q=80";
    } 
    else if (style === "scandinavian") {
      imageUrl = "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&h=1200&fit=crop&q=80";
    } 
    else if (style === "royal") {
      imageUrl = "https://images.unsplash.com/photo-1544083183-a5bc87cf5b14?w=1200&h=1200&fit=crop&q=80";
    } 
    else if (style === "industrial") {
      imageUrl = "https://images.unsplash.com/photo-1484154218962-a5bc87cf5b14?w=1200&h=1200&fit=crop&q=80";
    } 
    else {
      imageUrl = "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&h=1200&fit=crop&q=80";
    }

    await db.insert(visualizationEvents).values({
      tileId: tileIds?.[0] ?? null,
      roomType,
      eventType: "mood_board",
    }).catch(() => {});

    res.json({
      imageUrl,
      prompt,
      tileDetails: tileContext,
      demoMode: true,
      message: "Concept mood board generated successfully",
    });
  } catch (err) {
    req.log.error({ err }, "Error generating mood board");
    res.status(500).json({ error: "Failed to generate mood board" });
  }
});

export default router;
