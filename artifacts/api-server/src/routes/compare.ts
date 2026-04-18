import { Router } from "express";
import { db } from "@workspace/db";
import { tilesTable } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";
import { inArray } from "drizzle-orm";

const router = Router();

router.post("/compare", async (req, res) => {
  try {
    const { tileIds } = req.body as { tileIds?: unknown };

    if (
      !Array.isArray(tileIds) ||
      tileIds.length < 2 ||
      tileIds.length > 3 ||
      !tileIds.every((id) => typeof id === "number" && Number.isInteger(id) && id > 0)
    ) {
      res.status(400).json({ error: "Provide 2–3 valid tile IDs to compare." });
      return;
    }

    const validIds = tileIds as number[];
    const tiles = await db
      .select()
      .from(tilesTable)
      .where(inArray(tilesTable.id, validIds));

    if (tiles.length < 2) {
      res.status(404).json({ error: "Could not find the requested tiles." });
      return;
    }

    const tileDescriptions = tiles.map((t) =>
      `Tile: ${t.name} (SKU: ${t.sku})
  Category: ${t.category} | Room: ${t.room} | Finish: ${t.finish}
  Size: ${t.size} | Color: ${t.color}
  Price: ₹${t.pricePerSqft} per sqft
  Collection: ${t.collection || "Standard"}
  Description: ${t.description || t.aiEmbeddingText || "Premium ceramic tile"}`
    ).join("\n\n---\n\n");

    const systemPrompt = `You are a professional interior design consultant and tile expert at SOMAI IntelliTile AI. 
You provide precise, insightful comparisons that help customers make informed purchasing decisions.
Be specific, refer to each tile by name, and give actionable recommendations. Keep your analysis sharp and concise.`;

    const userPrompt = `Compare these ${tiles.length} tiles across 4 dimensions. Return your response as a JSON object.

TILES TO COMPARE:
${tileDescriptions}

Return this exact JSON structure (no markdown, raw JSON only):
{
  "summary": "A 2-sentence executive summary of the comparison",
  "aesthetics": {
    "heading": "Aesthetic Appeal",
    "insights": [
      {"tileName": "<tile name>", "analysis": "<2-3 sentence aesthetic analysis>", "score": <1-10>}
    ],
    "winner": "<name of tile with best overall aesthetic versatility>",
    "winnerReason": "<one sentence why>"
  },
  "priceValue": {
    "heading": "Price-Per-Value",
    "insights": [
      {"tileName": "<tile name>", "analysis": "<value for money analysis including durability and finish quality>", "score": <1-10>}
    ],
    "winner": "<name of tile with best price-to-value ratio>",
    "winnerReason": "<one sentence why>"
  },
  "roomFit": {
    "heading": "Best Room Fit",
    "insights": [
      {"tileName": "<tile name>", "bestRooms": ["<room1>", "<room2>"], "worstRooms": ["<room1>"], "analysis": "<why it fits or doesn't fit certain spaces>"}
    ]
  },
  "overallWinner": {
    "tileName": "<name of overall best tile>",
    "reason": "<2-3 sentence compelling reason — for whom and why>"
  }
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.4,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let analysis: Record<string, unknown>;
    try {
      analysis = JSON.parse(raw);
    } catch {
      analysis = { summary: raw };
    }

    res.json({ tiles, analysis });
  } catch (err) {
    console.error("Compare error:", err);
    res.status(500).json({ error: "Failed to generate comparison." });
  }
});

export default router;
