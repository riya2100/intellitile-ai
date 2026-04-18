import { Router } from "express";
import { db } from "@workspace/db";
import { tilesTable, visualizationEvents } from "@workspace/db";
import { GenerateRoomVisualizationBody, GenerateMoodBoardBody } from "@workspace/api-zod";
import { generateImageBuffer } from "@workspace/integrations-openai-ai-server/image";
import { eq } from "drizzle-orm";

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

    const prompt = `Professional interior design photograph of a beautiful ${roomName} with ${tileDetail} tiles installed. ${roomDescription ? roomDescription + "." : ""} The room features elegant modern Indian interior design with:
- The ${tile.name} tiles prominently featured on the ${roomType.includes("bathroom") || roomType.includes("kitchen") ? "walls and floor" : "floor"}
- Perfect lighting showcasing the ${tile.finish} finish and ${tile.color} tones
- Premium furniture and decor complementing the tile aesthetic
- Architectural photography style, 4K quality, realistic lighting
- Style: ${tile.collection ?? "Contemporary"} collection aesthetic
Photorealistic, magazine-quality interior design photo, no text or watermarks.`;

    const imageBuffer = await generateImageBuffer(prompt, "1024x1024");

    await db.insert(visualizationEvents).values({
      tileId,
      roomType,
      eventType: "room",
    }).catch(() => {});

    res.json({
      imageBase64: imageBuffer.toString("base64"),
      prompt,
      tileDetails: tileDetail,
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
      const tiles = await db.select().from(tilesTable).limit(tileIds.length);
      tileContext = tiles.map((t) => `${t.name} (${t.color}, ${t.finish})`).join(", ");
    }

    const styleDescriptions: Record<string, string> = {
      modern: "clean lines, minimalist, monochrome palette, geometric patterns, sleek surfaces",
      rustic: "warm earthy tones, natural textures, terracotta and wood accents, cozy atmosphere",
      scandinavian: "bright whites, natural light, simple functional design, hygge aesthetic, neutral palette",
      royal: "opulent gold and cream tones, ornate patterns, marble-look tiles, grand architectural elements",
      industrial: "exposed concrete, dark tones, metal accents, raw textures, urban loft aesthetic",
      bohemian: "eclectic mix of colors and patterns, layered textures, cultural influences, vibrant energy",
      minimalist: "maximum whitespace, single accent color, essential elements only, serene and calm",
    };

    const prompt = `Professional interior design mood board for a ${style} style ${roomType.replace(/_/g, " ")}.
Design aesthetic: ${styleDescriptions[style] ?? style}
${colorPalette ? `Color palette: ${colorPalette}` : ""}
${tileContext ? `Featured Somany Ceramics tiles: ${tileContext}` : ""}

Create a sophisticated mood board layout showing:
- The complete interior space with tile application
- Material samples and texture swatches
- Color palette chips
- Decorative elements and furniture pieces that complement the style
- Professional design studio presentation quality
- Typography labels for materials (minimal, elegant)
Photorealistic collage, interior design magazine quality, 4K resolution.`;

    const imageBuffer = await generateImageBuffer(prompt, "1024x1024");

    await db.insert(visualizationEvents).values({
      tileId: tileIds?.[0] ?? null,
      roomType,
      eventType: "mood_board",
    }).catch(() => {});

    res.json({
      imageBase64: imageBuffer.toString("base64"),
      prompt,
      tileDetails: tileContext,
    });
  } catch (err) {
    req.log.error({ err }, "Error generating mood board");
    res.status(500).json({ error: "Failed to generate mood board" });
  }
});

export default router;
