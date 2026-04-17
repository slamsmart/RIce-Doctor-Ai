# Rice Doctor AI

## Overview

AI-powered crop disease detection, fertilizer recommendations, multilingual farmer guidance, and regional monitoring for ASEAN agriculture teams and smallholder farmers.

## Stack

- Monorepo: pnpm workspaces
- Node.js: 24
- TypeScript: 5.9
- Frontend: React + Vite
- API: Express 5
- Database: PostgreSQL + Drizzle ORM
- Validation: Zod + drizzle-zod
- API codegen: Orval
- Charts: Recharts
- Motion: Framer Motion
- AI: Alibaba Cloud DashScope with Qwen-VL and Qwen text models

## Key Features

1. AI crop disease detection for rice, oil palm, corn, and cassava
2. Smart treatment and fertilizer recommendations
3. Multilingual farmer guidance
4. Government dashboard with scan analytics
5. Crop and disease knowledge library
6. Monitoring and outbreak reporting
7. Multi-country ASEAN support for Indonesia, Thailand, Vietnam, Philippines, and Malaysia

## Main Routes

### Frontend

- `/` home and summary
- `/scan` crop upload and scan flow
- `/scan/:id` scan detail and result page
- `/recommend` treatment recommendation list
- `/crops` crop and disease library
- `/dashboard` analytics dashboard
- `/reports` monitoring report list
- `/reports/:id` report detail

### API

- `GET /api/healthz`
- `GET/POST /api/scans`
- `GET /api/scans/:id`
- `GET /api/scans/stats/summary`
- `GET /api/scans/stats/by-country`
- `GET /api/scans/stats/by-disease`
- `GET /api/scans/stats/recent`
- `GET/POST /api/recommendations`
- `GET /api/recommendations/:id`
- `GET /api/crops`
- `GET /api/crops/:id`
- `POST /api/voice/guidance`
- `GET/POST /api/reports`
- `GET /api/reports/:id`

## Database

- `scansTable` stores crop scan inputs and AI results
- `recommendationsTable` stores treatment and fertilizer guidance per scan
- `cropsTable` stores crop and disease library data
- `reportsTable` stores operational monitoring reports

## AI Integration

The current implementation uses Alibaba Cloud DashScope:

- `qwen3-vl-plus` for crop image understanding
- `qwen-plus-latest` or `qwen-max-latest` for text generation

The AI layer currently powers:

- disease detection from crop images
- ASEAN-aware recommendations
- monitoring report generation
- multilingual farmer-facing guidance

## Environment Variables

- `DASHSCOPE_API_KEY` required DashScope API key
- `DASHSCOPE_BASE_URL` optional OpenAI-compatible endpoint, default `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
- `DASHSCOPE_VL_MODEL` optional vision model, default `qwen3-vl-plus`
- `DASHSCOPE_TEXT_MODEL` optional text model, default `qwen-plus-latest`

## Key Commands

- `pnpm install`
- `pnpm run build`
- `pnpm run typecheck`
- `pnpm --filter @workspace/api-server run dev`
- `pnpm --filter @workspace/smart-crop-ai run dev`

## Notes

- The project is intentionally model-agnostic at the workflow layer.
- The product logic consumes normalized structured outputs so provider re-routing stays fast.
- This makes the repository suitable both as an MVP and as a migration-ready Qwen foundation.
