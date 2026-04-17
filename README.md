# Rice Doctor AI

Rice Doctor AI is a rapid MVP for crop-disease detection, farmer guidance, and agricultural monitoring across ASEAN farming workflows.

## Why This Project Matters

Smallholder farmers and agricultural field teams often need fast answers from imperfect field data:
- a crop photo from a phone
- limited local agronomy support
- urgent need for practical treatment guidance
- reporting requirements for regional monitoring teams

Rice Doctor AI turns that workflow into a single pipeline:
1. capture a crop image
2. analyze likely disease conditions
3. generate practical treatment guidance
4. produce monitoring-ready reports
5. deliver multilingual farmer-facing instructions

## Why Qwen

This project is a strong fit for Qwen because the product needs both multimodal understanding and high-quality text generation in one workflow.

Qwen is used here for:
- visual crop scan analysis through Qwen-VL
- recommendation and guidance generation through Qwen text models
- report drafting for monitoring and operational teams
- multilingual farmer communication

That combination makes Qwen a natural match for a real agricultural assistant, where image understanding and grounded text outputs must work together.

## Prototype Positioning

This repository should be understood as a prototype MVP built to prove the end-to-end scanning workflow quickly.

The immediate goal was not to lock the system to one provider, but to validate the operational flow:
- crop image upload
- AI disease analysis
- treatment recommendation generation
- report writing
- multilingual guidance delivery

## Model-Agnostic Architecture

The architecture is intentionally model-agnostic.

The backend separates:
- request handling
- persistence and reporting logic
- prompt construction
- model inference calls
- normalized JSON response shaping

Because of that separation, the product logic does not depend on one tightly coupled model SDK. The app consumes structured outputs, which makes provider re-routing fast and low-risk.

## Re-Routing Narrative

This is a prototype MVP created to validate the vision scanning workflow quickly.

Its architecture is already prepared for rapid connection to Alibaba Cloud Qwen-VL because the system depends on normalized response contracts rather than embedding business logic directly inside one vendor-specific implementation.

In practical terms:
- the workflow is already proven
- the provider layer is replaceable
- the migration path to Qwen-VL is short because the response format is structurally similar

## Current Qwen Direction

The current implementation direction is Alibaba Cloud DashScope with:
- `qwen3-vl-plus` for crop image understanding
- `qwen-plus-latest` or `qwen-max-latest` for text generation tasks

This makes the repository both:
- a working agricultural AI prototype
- a migration-ready foundation for a Qwen-powered production system

## Technical Architecture

- Frontend: React + Vite
- API: Express 5
- Database: PostgreSQL + Drizzle ORM
- Validation: Zod
- Monorepo: pnpm workspaces
- AI routing: Alibaba Cloud DashScope, using Qwen vision and text models through a normalized API layer

## Demo Flow

The clearest demo path for judges is:
1. upload a crop image on the scan page
2. show the Qwen-powered disease analysis result
3. open the recommendation flow for treatment guidance
4. generate a monitoring report from the same workflow
5. switch to multilingual farmer guidance to show real field usability

## Why This Is Judge-Friendly

This project is not just a model demo. It shows a usable product flow with:
- multimodal input
- structured operational outputs
- regional relevance for ASEAN agriculture
- multilingual accessibility
- a provider-flexible architecture ready for rapid iteration on Qwen

That is the key point: the prototype proves the workflow, and the architecture is already aligned with fast Qwen adoption.
