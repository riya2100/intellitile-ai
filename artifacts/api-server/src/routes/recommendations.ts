import { Router } from "express";
import { db } from "@workspace/db";
import { tilesTable, recommendationEvents } from "@workspace/db";
import { GetAiRecommendationsBody } from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";
import { ilike, or, eq, lte, gte, and } from "drizzle-orm";

const router = Router();

router.post("/recommendations", async (req, res) => {
  try {
    const body = GetAiRecommendationsBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }

    const { query, roomType, budget, stylePreference } = body.data;

    const allTiles = await db
      .select({
        id: tilesTable.id,
        name: tilesTable.name,
        category: tilesTable.category,
        finish: tilesTable.finish,
        room: tilesTable.room,
        color: tilesTable.color,
        pricePerSqft: tilesTable.pricePerSqft,
        description: tilesTable.description,
        collection: tilesTable.collection,
        aiEmbeddingText: tilesTable.aiEmbeddingText,
      })
      .from(tilesTable)
      .where(
        budget
          ? lte(tilesTable.pricePerSqft, String(budget))
          : undefined
      )
      .limit(50);

    const tileListForAI = allTiles
      .map(
        (t) =>
          `ID:${t.id} | ${t.name} | ${t.category} | ${t.finish} | ${t.room} | ${t.color} | ₹${t.pricePerSqft}/sqft | ${t.aiEmbeddingText ?? t.description}`
      )
      .join("\n");

    const systemPrompt = `You are TileGenius, Somany Ceramics' expert AI design advisor with deep knowledge of interior design, tile materials, and Indian home aesthetics. Your job is to recommend the most suitable tiles from the Somany catalog based on customer requirements.

When recommending:
- Consider room functionality, durability needs, and aesthetic alignment
- Think about India's climate, lifestyle, and common home styles
- Be specific about WHY each tile suits the customer's needs
- Detect the customer's design style profile from their query

Available tiles:
${tileListForAI}

Respond ONLY in this JSON format (no markdown, pure JSON):
{
  "tileIds": [<array of tile IDs, max 6>],
  "reasoning": "<2-3 sentences explaining the selection, mentioning specific tile properties>",
  "styleProfile": "<detected design style: Modern/Traditional/Rustic/Contemporary/Scandinavian/Royal/Industrial/Bohemian>",
  "alternativeSuggestions": ["<suggestion 1>", "<suggestion 2>", "<suggestion 3>"]
}`;

    const userMessage = `Customer query: "${query}"${roomType ? `\nRoom: ${roomType}` : ""}${budget ? `\nBudget: ₹${budget}/sqft max` : ""}${stylePreference ? `\nStyle preference: ${stylePreference}` : ""}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 1024,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });

    let aiResponse = { tileIds: [] as number[], reasoning: "", styleProfile: "Modern", alternativeSuggestions: [] as string[] };

    try {
      const responseText = completion.choices[0]?.message?.content ?? "{}";
      aiResponse = JSON.parse(responseText);
    } catch {
      req.log.warn("Failed to parse AI response as JSON, using fallback");
    }

    const recommendedTiles = await db
      .select()
      .from(tilesTable)
      .where(
        or(...aiResponse.tileIds.map((id) => eq(tilesTable.id, id))) ?? eq(tilesTable.id, -1)
      )
      .limit(6);

    await db.insert(recommendationEvents).values({
      query,
      roomType: roomType ?? null,
      styleProfile: aiResponse.styleProfile,
      tileIdsReturned: recommendedTiles.map((t) => t.id),
    }).catch(() => {});

    res.json({
      tiles: recommendedTiles.map((t) => ({ ...t, pricePerSqft: Number(t.pricePerSqft), rating: Number(t.rating) })),
      reasoning: aiResponse.reasoning,
      styleProfile: aiResponse.styleProfile,
      alternativeSuggestions: aiResponse.alternativeSuggestions ?? [],
    });
  } catch (err) {
    req.log.error({ err }, "Error getting AI recommendations");
    res.status(500).json({ error: "Failed to generate recommendations" });
  }
});

export default router;
