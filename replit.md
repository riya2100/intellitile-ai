# TileGenius — AI Design Intelligence Platform for Somany Ceramics

## Overview

Full-stack AI platform combining NLP recommendations, generative image visualization, streaming AI chat, and analytics. Built as an interview portfolio project for Somany Ceramics (India's #2 ceramics brand) — demonstrating AI/ML + Generative AI engineering skills.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (auto-generated from OpenAPI spec)
- **API codegen**: Orval (from OpenAPI spec → React Query hooks + Zod schemas)
- **Build**: esbuild (CJS bundle)
- **AI**: OpenAI GPT-5.2 (chat) + gpt-image-1 (image generation)
- **Frontend**: React + Vite + Tailwind CSS + Framer Motion + Recharts

## Artifacts

- **tile-genius** (`/`) — React frontend: Home, Catalog, Tile Detail, AI Advisor, Visualizer, Dashboard
- **api-server** (`/api`) — Express REST API with all AI endpoints

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/tile-genius run dev` — run frontend locally
- `pnpm --filter @workspace/scripts run seed-tiles` — seed the tile catalog

## AI Features

1. **Semantic Tile Recommender** — GPT-5.2 maps natural language queries to catalog tiles with structured JSON reasoning
2. **Generative Room Visualizer** — gpt-image-1 renders photorealistic rooms with applied tiles
3. **Mood Board Generator** — Style-driven GenAI creates complete design direction boards
4. **AI Design Chat Advisor** — Streaming SSE chat with domain-expert system prompt + conversation memory
5. **AI Semantic Search** — `ai_embedding_text` field for intent-aware catalog search

## Database Tables

- `tiles` — 16 curated catalog entries with AI metadata
- `conversations` — UUID-keyed chat sessions
- `messages` — Chat history with tile_ids reference tracking
- `recommendation_events` — AI query analytics (query, room, style, results)
- `visualization_events` — GenAI usage tracking (tile, room, type)

## API Routes

```
GET  /api/tiles                     — Paginated catalog with filters
GET  /api/tiles/:id                 — Single tile details  
GET  /api/tiles/similar/:id         — Similar tiles
GET  /api/tiles/trending            — Trending tiles
POST /api/recommendations           — AI NLP recommender
POST /api/visualizer/generate       — AI room visualization
POST /api/visualizer/mood-board     — GenAI mood board
GET  /api/conversations             — Chat sessions
POST /api/conversations             — Create session
GET  /api/conversations/:id         — Session with history
POST /api/conversations/:id/messages — AI chat (SSE stream)
GET  /api/analytics/dashboard       — Platform metrics
GET  /api/analytics/popular-rooms   — Room popularity
GET  /api/analytics/design-trends   — AI design trends
```
