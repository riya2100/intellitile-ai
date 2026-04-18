import { Router } from "express";
import { db } from "@workspace/db";
import { conversations, messages, tilesTable } from "@workspace/db";
import { SendTileChatBody, CreateConversationBody } from "@workspace/api-zod";
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

    if (tileContext && tileContext.length > 0) {
      await db
        .select()
        .from(tilesTable)
        .where(inArray(tilesTable.id, tileContext))
        .limit(5);
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

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const userInput = content.toLowerCase();
    let fullResponse = "";

    if (userInput.includes("kitchen")) {
      fullResponse =
        "For kitchens, I recommend anti-skid granite-look or matte ceramic tiles. They are durable, stain-resistant, and easy to clean. Darker shades or textured finishes work well for high-traffic areas.";
    } else if (userInput.includes("bathroom")) {
      fullResponse =
        "For bathrooms, use anti-skid floor tiles and glossy or satin wall tiles. Light shades like white, beige, or grey can make the space feel larger and cleaner.";
    } else if (userInput.includes("bedroom")) {
      fullResponse =
        "For bedrooms, warm tones like beige, wood-look, or soft matte tiles create a cozy and relaxing feel. Matte finishes are usually more comfortable and less reflective.";
    } else if (userInput.includes("living")) {
      fullResponse =
        "For living rooms, large-format vitrified or marble-finish tiles give a premium and spacious look. Glossy finishes can enhance brightness, while matte finishes feel more modern.";
    } else if (userInput.includes("budget") || userInput.includes("cheap")) {
      fullResponse =
        "If you're on a budget, ceramic tiles under ₹60/sqft are a practical choice. You can still get modern looks with matte finishes, stone textures, or simple neutral colors.";
    } else if (userInput.includes("color")) {
      fullResponse =
        "Choose tile color based on room size and lighting. Light colors work well for small or darker rooms, while deeper tones suit larger spaces. Beige, grey, and white are safe and versatile.";
    } else {
      fullResponse =
        "I suggest choosing tiles based on room type, lighting, budget, and finish preference. Matte tiles are better for safety, glossy tiles add luxury, and textured tiles are useful in wet or outdoor areas.";
    }

    res.write(`data: ${JSON.stringify({ content: fullResponse })}\n\n`);

    await db.insert(messages).values({
      conversationId,
      role: "assistant",
      content: fullResponse,
      tileIds: [],
    });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "Error in chat message");
    res.write(`data: ${JSON.stringify({ error: "Failed to generate response" })}\n\n`);
    res.end();
  }
});

export default router;
