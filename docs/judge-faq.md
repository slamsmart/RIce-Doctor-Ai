# Judge FAQ

## Why Qwen?

Qwen is a strong fit because this product needs both multimodal understanding and high-quality operational text generation in one workflow. We use Qwen-VL for crop image analysis and Qwen text models for recommendations, reports, and multilingual farmer guidance. That lets one family of models support the full agricultural workflow instead of only one isolated task.

## Why ASEAN?

ASEAN agriculture is a strong use case because many farming workflows combine mobile-first input, limited expert access, multilingual communication, and urgent field decisions. That makes the value of image analysis plus practical text generation much more immediate. The app is designed around real regional constraints such as local cooperatives, field teams, and country-specific deployment contexts.

## What is technically novel here?

The novelty is not just calling a model. The product turns one crop image into a full decision-support pipeline:
- disease analysis
- treatment recommendation
- monitoring report generation
- multilingual farmer guidance

The architecture is also intentionally model-agnostic. The workflow layer depends on normalized structured outputs, so model routing can change without rewriting the rest of the application. That makes the system practical for fast experimentation, migration, and deployment.

## Is this a prototype or a production system?

It is a rapid MVP prototype designed to validate the workflow quickly. The goal is to prove that the end-to-end product loop works in a field-relevant setting while keeping the architecture ready for continued iteration toward production.

## What makes this more than a model demo?

This is a product workflow demo, not a single prompt demo. The system connects image input, structured reasoning, field recommendations, reporting, and multilingual delivery in one usable flow. That is what makes the Qwen integration meaningful in practice.

## Why does the model-agnostic approach matter?

It reduces vendor lock-in and speeds up iteration. The API layer owns prompt construction, persistence, and output normalization, so the rest of the product stays stable even when the provider layer changes. That is especially useful in hackathon-to-production transitions.
