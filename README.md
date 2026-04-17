# Rice Doctor AI

Rice Doctor AI is a rapid MVP for crop-disease detection, farmer guidance, and agricultural monitoring workflows across ASEAN use cases.

## Prototype Positioning

This project was built as a fast prototype to validate the end-to-end vision scanning workflow:
- crop image upload
- AI-powered disease analysis
- treatment recommendation generation
- report writing for monitoring teams
- multilingual farmer guidance

The architecture is intentionally model-agnostic. The application logic is separated from the model provider so the scanning and text-generation flows can be re-routed without redesigning the product.

## Model-Agnostic Design

This version should be understood as a prototype MVP that proves the workflow, not as a locked single-model implementation.

The backend is structured so that:
- request handling, persistence, and response shaping live in the API layer
- model prompts and inference calls can be swapped independently
- downstream consumers keep receiving similar structured JSON outputs

Because of that design, the system is ready to connect to Qwen-VL through Alibaba Cloud DashScope with minimal disruption. The response contracts used by the app were deliberately kept close to a provider-neutral JSON format so the migration path stays short and practical.

## Re-Routing Narrative

This is a prototype MVP created to prove the vision scanning workflow quickly.

Its architecture is already prepared for rapid connection to Alibaba Cloud Qwen-VL because the response format is structurally similar and the application depends on normalized outputs rather than tightly coupling business logic to one model vendor.

In other words:
- the workflow is already validated
- the provider layer is replaceable
- the current build is suitable for fast migration and continued iteration on Qwen-VL

## Current Direction

The current direction of the project is migration toward Qwen-VL and Qwen text models through Alibaba Cloud DashScope for:
- crop image understanding
- recommendation generation
- report drafting
- multilingual farmer-facing guidance

That makes this repository both a working prototype and a practical migration-ready foundation for a Qwen-powered production version.
