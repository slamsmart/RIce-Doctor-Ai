# Rice Doctor AI

## Overview

AI-powered rice disease detection, fertilizer recommendations, and regional monitoring app for ASEAN governments and smallholder farmers. Built for the ASEAN AI Hackathon. Previously named "Smart Crop AI".

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/smart-crop-ai)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **AI**: Qwen-VL via Alibaba Cloud DashScope for crop scan analysis
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Routing**: Wouter (frontend), Express 5 (backend)
- **Charts**: Recharts
- **Animations**: Framer Motion

## Key Features

1. **AI Crop Disease Detection** — Upload a photo of rice, oil palm, corn, or cassava; Qwen-VL analyzes the image and returns disease name, confidence score (0-100%), severity (mild/moderate/severe), AI analysis text, and treatment suggestion.
2. **Smart Fertilizer Recommendations** — AI generates fertilizer type, dosage, application method, and nearest local store (cooperative/kiosk) for each detected disease by country.
3. **Voice Guidance** — AI-generated treatment explanation in 8 languages: English, Bahasa Indonesia, Thai, Vietnamese, Filipino, Javanese, Sundanese, Malay.
4. **Government Dashboard** — Stats cards, bar chart by country, disease distribution pie chart, recent scans feed.
5. **Crop & Disease Library** — Database of Rice, Oil Palm, Corn, Cassava with common diseases per ASEAN country.
6. **Government Reports** — Create and view weekly/monthly/outbreak_alert/survey reports with risk level badges.
7. **ASEAN Multi-country** — Supports Indonesia (ID), Thailand (TH), Vietnam (VN), Philippines (PH), Malaysia (MY).

## Routes

### Frontend Pages (artifacts/smart-crop-ai)
- `/` — Home/landing with hero, stats, recent activity
- `/scan` — Upload crop photo and submit for AI analysis
- `/scan/:id` — Scan detail: disease result, confidence bar, voice guidance, recommendation
- `/recommend` — Fertilizer recommendations list
- `/crops` — Crop & disease library
- `/dashboard` — Government analytics dashboard
- `/reports` — Monitoring reports list
- `/reports/:id` — Report detail

### API Routes (artifacts/api-server)
- `GET /api/healthz` — Health check
- `GET/POST /api/scans` — List/create scans
- `GET /api/scans/stats/summary` — Dashboard summary
- `GET /api/scans/stats/by-country` — Scans grouped by country
- `GET /api/scans/stats/by-disease` — Scans grouped by disease
- `GET /api/scans/stats/recent` — Last 10 scans
- `GET /api/scans/:id` — Scan detail
- `GET/POST /api/recommendations` — List/create recommendations
- `GET /api/recommendations/:id` — Recommendation detail
- `GET /api/crops` — List crops
- `GET /api/crops/:id` — Crop detail
- `POST /api/voice/guidance` — Generate multilingual farmer voice guidance text
- `GET/POST /api/reports` — List/create reports
- `GET /api/reports/:id` — Report detail

## Database Schema (lib/db/src/schema/)

- `scansTable` — Crop scans with AI analysis results
- `recommendationsTable` — Fertilizer recommendations per scan
- `cropsTable` — Crop types and disease library
- `reportsTable` — Government monitoring reports

## Mobile App (artifacts/smart-crop-mobile)

Expo React Native app — same features as the web app, mobile-native UI for Android APK and iOS.

- **Framework**: Expo SDK 54 + Expo Router
- **Preview path**: `/smart-crop-mobile/`
- **Tab navigation**: Home | Scan | Dashboard | Reports
- **Key screens**:
  - `(tabs)/index.tsx` — Home: hero stats + recent scans feed
  - `(tabs)/scan.tsx` — New scan: image picker (camera/gallery) + crop form + AI analysis
  - `(tabs)/dashboard.tsx` — Gov. dashboard: bar charts by country and disease
  - `(tabs)/reports.tsx` — Monitoring reports list + detail modal
  - `scan-detail/[id].tsx` — Full analysis + fertilizer recommendation + voice guidance (8 languages)
- **Design tokens**: Synced from web app (primary: #1a6635, accent: #f59f0a, Inter font, radius: 8px)
- **iOS publishing**: via Replit Expo Launch (click Publish button)
- **Android APK**: Not directly supported on Replit — must use EAS CLI externally

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## AI Integration

Uses Alibaba Cloud DashScope for crop scan analysis, treatment recommendations, report writing, and multilingual voice guidance. Environment variables:
- `DASHSCOPE_API_KEY` — required API key for DashScope Model Studio
- `DASHSCOPE_BASE_URL` — optional OpenAI-compatible base URL; defaults to `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
- `DASHSCOPE_VL_MODEL` — optional model name; defaults to `qwen3-vl-plus`
- `DASHSCOPE_TEXT_MODEL` — optional text model for report generation; defaults to `qwen-plus-latest` and can be set to `qwen-max-latest` for higher-quality report writing
