import { Router } from "express";
import { db } from "@workspace/db";
import { conversations, messages, tilesTable } from "@workspace/db";
import { SendTileChatBody, CreateConversationBody } from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";
import { eq, desc, count, inArray } from "drizzle-orm";

const router = Router();

router.get("/conversations", async (req, res) => {
  try {
    const convs = await db.select().from(conversations).orderBy(desc(conversations.updatedAt)).limit(50);

    const withCounts = await Promise.all(
      convs.map(async (conv) => {
        const msgCount = await db
          .select({ count: count() })
          .from(messages)
          .where(eq(messages.conversationId, conv.id));
        return {
          ...conv,
          messageCount: Number(msgCount[0]?.count ?? 0),
        };
      })
    );

    res.json(withCounts);
  } catch (err) {
    req.log.error({ err }, "Error listing conversations");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/conversations", async (req, res) => {
  try {
    const body = CreateConversationBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }

    const [conv] = await db
      .insert(conversations)
      .values({ title: body.data.title })
      .returning();

    res.status(201).json({ ...conv, messageCount: 0 });
  } catch (err) {
    req.log.error({ err }, "Error creating conversation");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/conversations/:id", async (req, res) => {
  try {
    const conv = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, req.params.id))
      .limit(1);

    if (!conv[0]) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, req.params.id))
      .orderBy(messages.createdAt);

    res.json({ ...conv[0], messages: msgs });
  } catch (err) {
    req.log.error({ err }, "Error getting conversation");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/conversations/:id", async (req, res) => {
  try {
    await db.delete(conversations).where(eq(conversations.id, req.params.id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Error deleting conversation");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/conversations/:id/messages", async (req, res) => {
  try {
    const body = SendTileChatBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }

    const { content, tileContext } = body.data;
    const conversationId = req.params.id;

    const conv = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (!conv[0]) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    const history = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt)
      .limit(20);

    let tileContextText = "";
    if (tileContext && tileContext.length > 0) {
      const contextTiles = await db
        .select()
        .from(tilesTable)
        .where(inArray(tilesTable.id, tileContext))
        .limit(5);
      tileContextText = `\n\nContext tiles being discussed:\n${contextTiles.map((t) => `- ${t.name}: ${t.category}, ${t.finish} finish, ${t.color}, ₹${t.pricePerSqft}/sqft, for ${t.room}. ${t.description}`).join("\n")}`;
    }

    await db.insert(messages).values({
      conversationId,
      role: "user",
      content,
      tileIds: tileContext ?? [],
    });

    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, conversationId));

    const systemPrompt = `You are TileGenius, Somany Ceramics' expert AI design advisor — an intelligent assistant that helps customers select the perfect tiles for their homes and spaces. You have deep knowledge of:

- Ceramic and vitrified tile specifications, finishes, and manufacturing
- Indian interior design trends and regional preferences
- Vastu Shastra considerations for tile placement and color
- Tile installation, maintenance, and care best practices
- Somany Ceramics' product catalog (ceramic wall/floor tiles, PVT, GVT, large slabs)
- Budget planning, quantity estimation, and cost optimization
- Tile combination and pairing recommendations
- Room-specific requirements (kitchen, bathroom, living room, outdoor, commercial)

You are helpful, knowledgeable, and conversational. When recommending tiles:
- Be specific with recommendations (mention tile types, finishes, patterns)
- Explain the practical and aesthetic reasoning behind suggestions
- Consider the Indian climate, lifestyle, and home architecture
- Provide cost estimates when asked
- Suggest complementary tiles for accent walls or borders
- Keep responses concise but complete — around 150-200 words unless a complex question needs more${tileContextText}`;

    const chatHistory = history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let fullResponse = "";

    let fullResponse = "";

// SMART AI LOGIC
const userInput = content.toLowerCase();

if (userInput.includes("kitchen")) {
  fullResponse = "For kitchens, I recommend anti-skid granite-look or matte ceramic tiles. They are durable, stain-resistant, and easy to clean. You can also consider darker shades to hide stains.";
}
else if (userInput.includes("bathroom")) {
  fullResponse = "For bathrooms, use anti-skid floor tiles and glossy wall tiles. Light colors like white or beige make the space feel larger and cleaner.";
}
else if (userInput.includes("bedroom")) {
  fullResponse = "For bedrooms, warm tones like wood-finish or beige matte tiles create a cozy and relaxing environment. Avoid glossy tiles for better comfort.";
}
else if (userInput.includes("living")) {
  fullResponse = "For living rooms, large-format vitrified tiles or marble-finish tiles give a premium and spacious look. Glossy finish enhances brightness.";
}
else if (userInput.includes("budget") || userInput.includes("cheap")) {
  fullResponse = "If you're on a budget, ceramic tiles under ₹60/sqft are a great option. They are affordable and come in many modern designs.";
}
else if (userInput.includes("color")) {
  fullResponse = "Tile color should match lighting. Light colors for small or dark rooms, darker shades for large spaces. Neutral tones like beige and grey are always safe choices.";
}
else {
  fullResponse = "Based on your requirements, I suggest choosing tiles depending on room type, lighting, and finish. Matte tiles for safety, glossy for luxury, and textured tiles for outdoor use.";
}

// STREAM RESPONSE (important for UI)
res.write(`data: ${JSON.stringify({ content: fullResponse })}\n\n`);
res.write(`data: ${JSON.stringify({ done: true })}\n\n`);

// SAVE TO DATABASE
await db.insert(messages).values({
  conversationId,
  role: "assistant",
  content: fullResponse,
  tileIds: [],
});

res.end();
  }
});

export default router;
