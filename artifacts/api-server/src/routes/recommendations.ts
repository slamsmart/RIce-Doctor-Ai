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
import { logger } from "../lib/logger";

const router: IRouter = Router();

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
const DASHSCOPE_BASE_URL =
  process.env.DASHSCOPE_BASE_URL ?? "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";
const DASHSCOPE_TEXT_MODEL = process.env.DASHSCOPE_TEXT_MODEL ?? "qwen-plus-latest";

const LOCAL_AVAILABILITY: Record<string, string[]> = {
  ID: ["Kios Pupuk Subsidi Desa", "Gapoktan setempat", "Toko Pertanian Kecamatan", "KUD (Koperasi Unit Desa)"],
  TH: ["Local Agricultural Cooperative", "BAAC Agricultural Outlet", "Provincial Farming Shop"],
  VN: ["Agricultural Cooperative Center", "Village Farming Supply Store", "Provincial Agri-Input Shop"],
  PH: ["Farmers' Cooperative (Samahang Magsasaka)", "Municipal Agriculture Office", "Local Farm Supply Store"],
  MY: ["FELDA/FELCRA Service Center", "State Agricultural Department Outlet", "Local Agro-Dealer"],
};

type RecommendationGeneration = {
  fertilizerName?: string;
  fertilizerType?: string;
  applicationMethod?: string;
  dosage?: string;
  subsidized?: boolean;
  aiGuidance?: string;
  additionalNotes?: string;
};

async function generateRecommendation(input: {
  cropType: string;
  disease: string;
  country: string;
  localOptions: string[];
}): Promise<RecommendationGeneration> {
  if (!DASHSCOPE_API_KEY) {
    throw new Error("DASHSCOPE_API_KEY must be set to generate recommendations with Qwen.");
  }

  const response = await fetch(`${DASHSCOPE_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${DASHSCOPE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: DASHSCOPE_TEXT_MODEL,
      messages: [
        {
          role: "system",
          content: `You are an agricultural expert for ASEAN countries. Provide fertilizer and treatment recommendations in valid JSON.
Respond with this exact structure:
{
  "fertilizerName": "product name",
  "fertilizerType": "chemical|organic|biological",
  "applicationMethod": "how to apply",
  "dosage": "specific dosage amount",
  "subsidized": true,
  "aiGuidance": "detailed guidance paragraph",
  "additionalNotes": "extra tips"
}
Keep recommendations practical, region-aware, and safe for farmers.`,
        },
        {
          role: "user",
          content: `Recommend treatment for ${input.cropType} with disease: ${input.disease}.
Country: ${input.country}
Prefer realistic options aligned with these local supply channels: ${input.localOptions.join(", ")}.`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 900,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DashScope recommendation failed (${response.status}): ${errorText}`);
  }

  const payload = await response.json() as {
    choices?: Array<{
      message?: {
        content?: string | Array<{ type?: string; text?: string }>;
      };
    }>;
  };

  const rawContent = payload.choices?.[0]?.message?.content;
  const content = typeof rawContent === "string"
    ? rawContent
    : rawContent?.find((item) => item.type === "text")?.text ?? "{}";

  return JSON.parse(content) as RecommendationGeneration;
}

router.get("/recommendations", async (req, res): Promise<void> => {
  const params = ListRecommendationsQueryParams.safeParse(req.query);
  let rows;

  if (params.success && params.data.scanId != null) {
    rows = await db.select().from(recommendationsTable).where(eq(recommendationsTable.scanId, params.data.scanId));
  } else {
    rows = await db.select().from(recommendationsTable);
  }

  res.json(rows.map((r) => ListRecommendationsResponseItem.parse({
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
    let rec: RecommendationGeneration = {};

    try {
      rec = await generateRecommendation({ cropType, disease, country, localOptions });
    } catch (parseOrRequestError) {
      logger.warn({ err: parseOrRequestError }, "Failed to generate recommendation with DashScope");
    }

    const [recommendation] = await db.insert(recommendationsTable).values({
      scanId,
      disease,
      cropType,
      country,
      fertilizerName: rec.fertilizerName ?? "NPK Compound Fertilizer",
      fertilizerType: (rec.fertilizerType ?? "chemical") as "chemical" | "organic" | "biological",
      applicationMethod: rec.applicationMethod ?? "Apply to soil around the plant base",
      dosage: rec.dosage ?? "2-3 kg per 100 m2",
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
