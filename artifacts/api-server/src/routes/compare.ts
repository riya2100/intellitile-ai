import { Router } from "express";
import { db } from "@workspace/db";
import { tilesTable } from "@workspace/db";
import { inArray } from "drizzle-orm";

const router = Router();

router.post("/compare", async (req, res) => {
  try {
    const tileIds = Array.isArray(req.body?.tileIds) ? req.body.tileIds : [];

    if (!tileIds.length) {
      res.status(400).json({ error: "No tiles selected for comparison." });
      return;
    }

    const tiles = await db
      .select()
      .from(tilesTable)
      .where(inArray(tilesTable.id, tileIds))
      .limit(3);

    if (!tiles.length) {
      res.status(404).json({ error: "No matching tiles found." });
      return;
    }

    const comparisonItems = tiles.map((tile, index) => {
      const strengths: string[] = [];

      if (tile.finish?.toLowerCase().includes("matte")) {
        strengths.push("good slip resistance");
      }
      if (tile.finish?.toLowerCase().includes("glossy")) {
        strengths.push("premium reflective finish");
      }
      if (tile.pattern?.toLowerCase().includes("wood")) {
        strengths.push("warm natural wood-look appeal");
      }
      if (tile.pattern?.toLowerCase().includes("marble")) {
        strengths.push("luxury marble-style appearance");
      }
      if ((tile.pricePerSqft ?? 0) <= 60) {
        strengths.push("budget-friendly");
      }
      if ((tile.rating ?? 0) >= 4.5) {
        strengths.push("high customer rating");
      }

      const strengthsText = strengths.length
        ? strengths.join(", ")
        : "balanced design and practical everyday use";

      return `${index + 1}. ${tile.name}
• Category: ${tile.category}
• Finish: ${tile.finish}
• Color: ${tile.color}
• Size: ${tile.size}
• Price: ₹${tile.pricePerSqft}/sqft
• Best for: ${tile.room}
• Key strength: ${strengthsText}
• Summary: ${tile.description}`;
    });

    const cheapest = [...tiles].sort(
      (a, b) => (a.pricePerSqft ?? 0) - (b.pricePerSqft ?? 0)
    )[0];

    const topRated = [...tiles].sort(
      (a, b) => (b.rating ?? 0) - (a.rating ?? 0)
    )[0];

    const recommendation = `Overall recommendation:
- Best budget choice: ${cheapest.name}
- Best rated choice: ${topRated.name}
- Final suggestion: Choose based on room type, finish preference, lighting, and budget. Matte/textured finishes are better for safety, while glossy finishes create a more premium look.`;

    res.json({
      comparison: `${comparisonItems.join("\n\n")}\n\n${recommendation}`,
      demoMode: true,
      tilesCompared: tiles.length,
    });
  } catch (err) {
    req.log.error({ err }, "Error generating comparison");
    res.status(500).json({ error: "Failed to generate comparison." });
  }
});

export default router;
