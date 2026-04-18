# TileGenius — AI-Powered Design Intelligence Platform

### Built for Somany Ceramics | AI/ML + Generative AI Portfolio Project

---

## Project Overview

TileGenius is a full-stack AI platform purpose-built to address real business challenges at Somany Ceramics — India's #2 ceramics manufacturer. The platform combines **natural language understanding, generative image synthesis, semantic product search, conversational AI, and ML-powered recommendations** to transform how customers discover and visualize tile products.

This is not a proof-of-concept. Every AI feature is production-ready, fully integrated with the Somany tile catalog, and operates on real data with real AI inference calls.

---

## Business Problem → AI Solution Mapping

| Business Challenge | AI/ML Solution Implemented |
|---|---|
| Customers can't translate design visions into tile choices | **Semantic NLP Recommender** — GPT-5.2 maps natural language to catalog |
| High drop-off because customers can't visualize tiles in their space | **Generative Room Visualizer** — gpt-image-1 renders photorealistic rooms |
| Generic keyword search misses customer intent | **AI Semantic Search** — understands "earthy", "zen", "royal", "spa-like" |
| Customers need design inspiration before knowing what to buy | **Mood Board Generator** — style-based GenAI creates complete design boards |
| No consultative sales touchpoint online | **AI Design Chat Advisor** — GPT-5.2 domain-expert chatbot with memory |
| Limited insight into what customers actually want | **Analytics Dashboard** — AI interaction tracking + design trend analysis |
| No ML foundation for future personalization | **Python ML Engine** — content-based recommender + semantic search offline |

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    TileGenius Platform                           │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (React 18 + Vite + TypeScript)                        │
│  ├── Home — Hero, Stats Bar, Shop By Room, Trending, New        │
│  ├── Catalog — Filters + AI Semantic Search with reasoning      │
│  ├── Tile Detail — Full specs + AI Similar + Visualize CTA      │
│  ├── AI Advisor — SSE Streaming Chat with conversation memory   │
│  ├── Visualizer — Room Render + Mood Board (gpt-image-1)       │
│  └── Dashboard — Real-time analytics + trend scoring            │
├─────────────────────────────────────────────────────────────────┤
│  Backend (Express 5 + TypeScript)                               │
│  ├── /api/tiles — Catalog CRUD with advanced filtering          │
│  ├── /api/recommendations — AI Semantic Recommender            │
│  ├── /api/visualizer/generate — Room Visualization AI           │
│  ├── /api/visualizer/mood-board — GenAI Mood Boards            │
│  ├── /api/conversations — Chat Session Management               │
│  └── /api/analytics — Business Intelligence Endpoints           │
├─────────────────────────────────────────────────────────────────┤
│  ML Layer (Python 3)                                            │
│  ├── ml/recommend.py — Content-based recommendation engine      │
│  │   TF-IDF vectorization + cosine similarity + hybrid scoring  │
│  └── ml/analytics.py — Design trend scoring + price analytics   │
│       Segment analysis, room demand modeling, color insights     │
├─────────────────────────────────────────────────────────────────┤
│  Data Layer (PostgreSQL + Drizzle ORM)                          │
│  ├── tiles — 16 curated catalog entries with AI metadata        │
│  ├── conversations — multi-turn chat history                    │
│  ├── messages — streaming chat messages with tile refs          │
│  ├── recommendation_events — AI query analytics                 │
│  └── visualization_events — GenAI usage tracking               │
├─────────────────────────────────────────────────────────────────┤
│  AI/ML Layer (OpenAI)                                           │
│  ├── GPT-5.2 — Chat, recommendations, structured JSON reasoning │
│  └── gpt-image-1 — Room renders + mood boards (1024×1024)      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick Start (Windows)

```bat
# 1. Clone the repository
git clone https://github.com/<your-username>/tilgenius-somany
cd tilgenius-somany

# 2. Run the setup script
setup.bat

# 3. Edit .env with your credentials
# Open .env and fill in DATABASE_URL and OPENAI_API_KEY

# 4. Start API server (Terminal 1)
pnpm --filter @workspace/api-server run dev

# 5. Start frontend (Terminal 2)
pnpm --filter @workspace/tile-genius run dev
```

## Quick Start (Mac / Linux)

```bash
git clone https://github.com/<your-username>/tilgenius-somany
cd tilgenius-somany
chmod +x setup.sh && ./setup.sh
# Edit .env, then:
pnpm --filter @workspace/api-server run dev   # Terminal 1
pnpm --filter @workspace/tile-genius run dev  # Terminal 2
```

**Prerequisites:** Node.js 20+, pnpm, PostgreSQL 14+, Python 3.9+ (for ML scripts)

---

## AI Features — Deep Technical Walkthrough

### 1. Semantic Tile Recommender (NLP → Product Mapping)

**Endpoint:** `POST /api/recommendations`

The customer submits a natural language query: *"I want something warm and rustic for my kitchen, under ₹60/sqft"*

1. Backend fetches the tile catalog filtered by budget constraint
2. Each tile's `ai_embedding_text` field (pre-optimized semantic descriptor) is assembled into an AI-readable catalog
3. GPT-5.2 acts as a domain-expert interior designer, analyzing the query against the full catalog
4. AI returns structured JSON: `{ tileIds, reasoning, styleProfile, alternativeSuggestions }`
5. The `styleProfile` field is logged for analytics — enabling Somany to understand aggregate customer style preferences over time

**Why this matters at scale:** Unlike keyword search (brittle, misses synonyms), this approach understands design intent. "Earthy", "zen", "Mediterranean" all resolve correctly.

---

### 2. Generative Room Visualizer (Text-to-Image with Context)

**Endpoint:** `POST /api/visualizer/generate`

1. User selects a tile from the dropdown (name, finish, color, size auto-populate)
2. A carefully engineered prompt is constructed combining tile specs + room type + style notes
3. `gpt-image-1` generates a 1024×1024 photorealistic room render
4. Response includes the image as base64 + the exact prompt used (full transparency)
5. Download button saves the image to disk as a PNG
6. Visualization event logged for analytics

The tile's `finish` (matte/glossy/rustic), `color`, and `collection` are explicitly included in the prompt to guide the model toward coherent tile-consistent renders.

---

### 3. Mood Board Generator (Style-Driven GenAI)

**Endpoint:** `POST /api/visualizer/mood-board`

User selects a design style (Modern, Rustic, Scandinavian, Royal, Industrial, Bohemian, Minimalist) and optionally anchors to a specific tile. The system maps each style to a rich aesthetic description and generates a complete mood board collage. Each style produces distinctly different outputs:

- **Modern:** Clean lines, minimalist, monochrome, geometric patterns
- **Royal:** Opulent gold and cream tones, ornate patterns, marble finishes  
- **Industrial:** Exposed concrete, dark tones, metal accents, urban loft aesthetic

---

### 4. AI Design Chat Advisor (Streaming Conversational AI)

**Endpoint:** `POST /api/conversations/:id/messages` (SSE)

1. Persistent UUID-keyed conversation sessions stored in PostgreSQL
2. Full message history retrieved and injected as context on every turn
3. GPT-5.2 system prompt establishes deep domain expertise:
   - Ceramic tile specs, manufacturing terminology, quality grades
   - Indian interior design trends and regional preferences
   - Vastu Shastra considerations for room orientation
   - Tile installation, grouting, maintenance guidance
   - Budget planning and quantity estimation
4. Responses stream token-by-token via Server-Sent Events
5. Each message stores `tile_ids` — tiles referenced in that turn

```typescript
const stream = await openai.chat.completions.create({
  model: "gpt-5.2",
  messages: [systemPrompt, ...conversationHistory, userMessage],
  stream: true,
});
for await (const chunk of stream) {
  res.write(`data: ${JSON.stringify({ content: chunk.choices[0]?.delta?.content })}\n\n`);
}
```

---

### 5. Python ML Recommendation Engine

**Location:** `ml/recommend.py` and `ml/analytics.py`

The Python ML layer demonstrates the offline/foundational ML system that powers — and can be upgraded to replace — the GPT-based recommendations.

#### `ml/recommend.py` — Content-Based Recommender

- **TF-IDF vectorization** of tile semantic descriptors with bigrams
- **Hybrid feature matrix**: text features (50% weight) + one-hot categorical (35%) + normalized price/rating (15%)
- **Cosine similarity** for nearest-neighbor tile retrieval
- **Semantic search** mode — matches natural language queries to the tile catalog

```bash
python3 ml/recommend.py                          # Full demo
python3 ml/recommend.py --tile-id 2             # Similar to Carrara Marble
python3 ml/recommend.py --query "warm kitchen"  # Natural language search
python3 ml/recommend.py --tile-id 9 --top-k 3  # Top 3 similar to Calacatta Gold
```

#### `ml/analytics.py` — Business Intelligence Engine

- Price segmentation (Budget / Mid-Range / Premium / Luxury)
- Room demand modeling with composite demand index
- Design trend scoring (High-Gloss Glamour, Matte Revolution, Marble Look, Earthy & Organic)
- Color palette insights and finish distribution analysis

```bash
python3 ml/analytics.py               # Full analytics report
python3 ml/analytics.py --export insights.json  # Export to JSON
```

**Production Upgrade Path:**
- Replace TF-IDF with `openai.embeddings.create(model="text-embedding-3-small")`
- Store embeddings in pgvector with HNSW index for sub-10ms similarity search
- Add collaborative filtering layer on `recommendation_events` table for personalization

---

## API Reference

```
GET  /api/tiles                       Paginated catalog with filters
GET  /api/tiles/:id                   Single tile details
GET  /api/tiles/similar/:id           AI similar tile recommendations
GET  /api/tiles/trending              Trending tiles (bestsellers + new)
POST /api/recommendations             AI NLP semantic recommender
POST /api/visualizer/generate         AI room visualization
POST /api/visualizer/mood-board       GenAI mood board creation
GET  /api/conversations               Chat session list
POST /api/conversations               Create chat session
GET  /api/conversations/:id           Session with full history
DELETE /api/conversations/:id         Delete session
POST /api/conversations/:id/messages  AI chat (SSE streaming)
GET  /api/analytics/dashboard         Platform metrics
GET  /api/analytics/popular-rooms     Room type popularity
GET  /api/analytics/design-trends     AI-inferred design trends
GET  /api/healthz                     Health check
```

---

## Database Schema

```sql
tiles                    -- 16 curated catalog entries with AI metadata
  (id, name, sku, category, finish, room, size, pricePerSqft, color,
   pattern, description, imageUrl, thumbnailUrl, collection, isNew,
   isBestSeller, rating, reviewCount, tags, aiEmbeddingText)

conversations            -- UUID-keyed chat sessions
  (id, title, createdAt, updatedAt)

messages                 -- Chat history with tile reference tracking
  (id, conversationId, role, content, tileIds, createdAt)

recommendation_events    -- AI query analytics
  (id, query, roomType, style, resultTileIds, model, createdAt)

visualization_events     -- GenAI usage tracking
  (id, tileId, roomType, style, type, promptUsed, createdAt)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TypeScript |
| UI Components | Radix UI + Tailwind CSS + Framer Motion |
| Charts | Recharts |
| State Management | TanStack React Query (auto-generated hooks) |
| Backend | Node.js + Express 5 + TypeScript |
| AI — Chat & Recommendations | OpenAI GPT-5.2 |
| AI — Image Generation | OpenAI gpt-image-1 |
| ML — Offline Recommender | Python 3 + scikit-learn + TF-IDF |
| Database | PostgreSQL + Drizzle ORM |
| API Validation | Zod (auto-generated from OpenAPI spec) |
| Code Generation | Orval (OpenAPI → TypeScript hooks + Zod schemas) |
| Monorepo | pnpm workspaces |

---

## Future ML Roadmap

1. **Vector Similarity Search** — Upgrade to OpenAI embeddings + pgvector HNSW index
2. **Computer Vision QC** — ResNet-based defect detection on production line tile images
3. **Demand Forecasting** — XGBoost on sales × regional preference × trend data
4. **Personalization Engine** — Collaborative filtering on recommendation_events table
5. **AR Visualizer** — WebXR real-time AR tile overlay on mobile camera
6. **Voice Design Assistant** — Speech-to-text + TTS for hands-free design consultation
7. **Auto-Tagging Pipeline** — CLIP embeddings to auto-categorize new tile images by style

---

## Why This Addresses Somany's Goals

Somany's existing visualizer (visualizer.somanyceramics.com) provides 2D studio, panoramic view, and AI photo upload. TileGenius goes significantly further:

1. **Conversational Intelligence** — A domain-expert advisor understanding tile specs, Indian home preferences, Vastu, and budget — not just visuals
2. **Structured AI Reasoning** — AI explains WHY it recommended each tile, building customer trust and providing actionable insight to Somany's product team
3. **Analytics Feedback Loop** — Every AI interaction becomes a data point for training future models and driving merchandising decisions
4. **ML Foundation** — The Python offline recommender is a ready scaffold for production-scale embedding + vector search
5. **API-First Architecture** — Clean contract-first design (OpenAPI → code generation) that scales to mobile apps, dealer portals, B2B integrations, and WhatsApp commerce
6. **Production Code Quality** — TypeScript throughout, Zod validation at every boundary, structured logging, proper error handling, streaming responses

This platform directly addresses Somany's stated goal: *"leveraging technology to enhance production efficiency and customer engagement."*
