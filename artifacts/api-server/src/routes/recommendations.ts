import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, recommendationsTable, scansTable } from "@workspace/db";
import {
  CreateRecommendationBody,
  GetRecommendationParams,
  GetRecommendationResponse,
  ListRecommendationsQueryParams,
  ListRecommendationsResponseItem,
} from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const LOCAL_AVAILABILITY: Record<string, string[]> = {
  ID: ["Kios Pupuk Subsidi Desa", "Gapoktan setempat", "Toko Pertanian Kecamatan", "KUD (Koperasi Unit Desa)"],
  TH: ["Local Agricultural Cooperative", "BAAC Agricultural Outlet", "Provincial Farming Shop"],
  VN: ["Agricultural Cooperative Center", "Village Farming Supply Store", "Provincial Agri-Input Shop"],
  PH: ["Farmers' Cooperative (Samahang Magsasaka)", "Municipal Agriculture Office", "Local Farm Supply Store"],
  MY: ["FELDA/FELCRA Service Center", "State Agricultural Department Outlet", "Local Agro-Dealer"],
};

router.get("/recommendations", async (req, res): Promise<void> => {
  const params = ListRecommendationsQueryParams.safeParse(req.query);
  let rows;

  if (params.success && params.data.scanId != null) {
    rows = await db.select().from(recommendationsTable).where(eq(recommendationsTable.scanId, params.data.scanId));
  } else {
    rows = await db.select().from(recommendationsTable);
  }

  res.json(rows.map(r => ListRecommendationsResponseItem.parse({
    ...r,
    createdAt: r.createdAt.toISOString(),
  })));
});

router.post("/recommendations", async (req, res): Promise<void> => {
  const parsed = CreateRecommendationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { scanId, country } = parsed.data;
  const [scan] = await db.select().from(scansTable).where(eq(scansTable.id, scanId));
  if (!scan) {
    res.status(404).json({ error: "Scan not found" });
    return;
  }

  const disease = scan.detectedDisease ?? "Unknown disease";
  const cropType = scan.cropType;
  const localOptions = LOCAL_AVAILABILITY[country] ?? ["Local farming cooperative", "Agricultural supply store"];
  const localStore = localOptions[Math.floor(Math.random() * localOptions.length)];

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 1024,
      messages: [
        {
          role: "system",
          content: `You are an agricultural expert for ASEAN countries. Provide fertilizer/treatment recommendations in JSON format.
Respond with this exact structure:
{
  "fertilizerName": "product name",
  "fertilizerType": "chemical|organic|biological",
  "applicationMethod": "how to apply",
  "dosage": "specific dosage amount",
  "subsidized": true/false,
  "aiGuidance": "detailed guidance paragraph",
  "additionalNotes": "extra tips"
}`
        },
        {
          role: "user",
          content: `Recommend treatment for ${cropType} with disease: ${disease}. The farmer is in ${country}. Focus on locally available products in ${country}.`
        }
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content ?? "{}";
    let rec: {
      fertilizerName?: string;
      fertilizerType?: string;
      applicationMethod?: string;
      dosage?: string;
      subsidized?: boolean;
      aiGuidance?: string;
      additionalNotes?: string;
    } = {};

    try {
      rec = JSON.parse(content);
    } catch {
      logger.warn("Failed to parse AI recommendation JSON");
    }

    const [recommendation] = await db.insert(recommendationsTable).values({
      scanId,
      disease,
      cropType,
      country,
      fertilizerName: rec.fertilizerName ?? "NPK Compound Fertilizer",
      fertilizerType: (rec.fertilizerType ?? "chemical") as "chemical" | "organic" | "biological",
      applicationMethod: rec.applicationMethod ?? "Apply to soil around the plant base",
      dosage: rec.dosage ?? "2-3 kg per 100m²",
      localAvailability: localStore,
      subsidized: rec.subsidized ?? false,
      aiGuidance: rec.aiGuidance ?? "Apply treatment as directed and monitor plant progress weekly.",
      additionalNotes: rec.additionalNotes ?? null,
    }).returning();

    if (!recommendation) {
      res.status(500).json({ error: "Failed to create recommendation" });
      return;
    }

    res.status(201).json(GetRecommendationResponse.parse({
      ...recommendation,
      createdAt: recommendation.createdAt.toISOString(),
    }));
  } catch (err) {
    logger.error({ err }, "AI recommendation failed");
    res.status(500).json({ error: "Failed to generate recommendation" });
  }
});

router.get("/recommendations/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetRecommendationParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid recommendation ID" });
    return;
  }

  const [rec] = await db.select().from(recommendationsTable).where(eq(recommendationsTable.id, params.data.id));
  if (!rec) {
    res.status(404).json({ error: "Recommendation not found" });
    return;
  }

  res.json(GetRecommendationResponse.parse({
    ...rec,
    createdAt: rec.createdAt.toISOString(),
  }));
});

export default router;
