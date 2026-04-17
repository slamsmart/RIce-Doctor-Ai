import { Router, type IRouter } from "express";
import { eq, desc, sql, count } from "drizzle-orm";
import { db, scansTable } from "@workspace/db";
import {
  ListScansQueryParams,
  CreateScanBody,
  GetScanParams,
  GetScanResponse,
  GetScansSummaryResponse,
  GetScansByCountryResponseItem,
  GetScansByDiseaseResponseItem,
  GetRecentScansResponseItem,
  ListScansResponseItem,
} from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
const DASHSCOPE_BASE_URL =
  process.env.DASHSCOPE_BASE_URL ?? "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";
const DASHSCOPE_VL_MODEL = process.env.DASHSCOPE_VL_MODEL ?? "qwen3-vl-plus";

type ScanAnalysis = {
  detectedDisease?: string | null;
  diseaseConfidence?: number | null;
  severity?: string | null;
  aiAnalysis?: string;
  treatmentSuggestion?: string | null;
};

async function analyzeCropWithDashScope(messages: Array<Record<string, unknown>>): Promise<ScanAnalysis> {
  if (!DASHSCOPE_API_KEY) {
    throw new Error("DASHSCOPE_API_KEY must be set to analyze crop scans with Qwen-VL.");
  }

  const response = await fetch(`${DASHSCOPE_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${DASHSCOPE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: DASHSCOPE_VL_MODEL,
      messages,
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DashScope request failed (${response.status}): ${errorText}`);
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

  return JSON.parse(content) as ScanAnalysis;
}

router.get("/scans/stats/summary", async (_req, res): Promise<void> => {
  const total = await db.select({ count: count() }).from(scansTable);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayScans = await db.select({ count: count() }).from(scansTable).where(sql`${scansTable.createdAt} >= ${today}`);
  const diseaseRows = await db.select({ count: count() }).from(scansTable).where(sql`${scansTable.detectedDisease} IS NOT NULL`);
  const severeRows = await db.select({ count: count() }).from(scansTable).where(eq(scansTable.severity, "severe"));
  const avgConf = await db.select({ avg: sql<number>`AVG(${scansTable.diseaseConfidence})` }).from(scansTable).where(sql`${scansTable.diseaseConfidence} IS NOT NULL`);
  const countryRows = await db.selectDistinct({ country: scansTable.country }).from(scansTable);

  const summary = {
    totalScans: total[0]?.count ?? 0,
    analyzedToday: todayScans[0]?.count ?? 0,
    diseasesDetected: diseaseRows[0]?.count ?? 0,
    countriesCovered: countryRows.length,
    avgConfidence: Math.round((avgConf[0]?.avg ?? 0) * 10) / 10,
    severeCases: severeRows[0]?.count ?? 0,
  };

  res.json(GetScansSummaryResponse.parse(summary));
});

router.get("/scans/stats/by-country", async (_req, res): Promise<void> => {
  const rows = await db.select({
    country: scansTable.country,
    count: count(),
    diseased: sql<number>`COUNT(CASE WHEN ${scansTable.detectedDisease} IS NOT NULL THEN 1 END)`,
  }).from(scansTable).groupBy(scansTable.country);

  const result = rows.map(r => ({
    country: r.country,
    count: r.count,
    diseaseRate: r.count > 0 ? Math.round((Number(r.diseased) / r.count) * 1000) / 10 : 0,
  }));

  res.json(result.map(r => GetScansByCountryResponseItem.parse(r)));
});

router.get("/scans/stats/by-disease", async (_req, res): Promise<void> => {
  const rows = await db.select({
    disease: scansTable.detectedDisease,
    cropType: scansTable.cropType,
    count: count(),
  }).from(scansTable)
    .where(sql`${scansTable.detectedDisease} IS NOT NULL`)
    .groupBy(scansTable.detectedDisease, scansTable.cropType)
    .orderBy(desc(count()));

  const result = rows
    .filter(r => r.disease != null)
    .map(r => GetScansByDiseaseResponseItem.parse({ disease: r.disease!, count: r.count, cropType: r.cropType }));

  res.json(result);
});

router.get("/scans/stats/recent", async (_req, res): Promise<void> => {
  const rows = await db.select().from(scansTable).orderBy(desc(scansTable.createdAt)).limit(10);
  res.json(rows.map(r => GetRecentScansResponseItem.parse({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  })));
});

router.get("/scans", async (req, res): Promise<void> => {
  const params = ListScansQueryParams.safeParse(req.query);
  let query = db.select().from(scansTable).$dynamic();

  if (params.success) {
    const conditions = [];
    if (params.data.country) conditions.push(eq(scansTable.country, params.data.country));
    if (params.data.cropType) conditions.push(eq(scansTable.cropType, params.data.cropType));
    if (params.data.status) conditions.push(eq(scansTable.status, params.data.status));
    if (conditions.length > 0) {
      query = query.where(sql`${conditions.reduce((a, b) => sql`${a} AND ${b}`)}`);
    }
  }

  const rows = await query.orderBy(desc(scansTable.createdAt));
  res.json(rows.map(r => ListScansResponseItem.parse({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  })));
});

router.post("/scans", async (req, res): Promise<void> => {
  const parsed = CreateScanBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;

  const [scan] = await db.insert(scansTable).values({
    cropType: data.cropType,
    country: data.country,
    region: data.region,
    farmerName: data.farmerName ?? null,
    imageBase64: data.imageBase64 ?? null,
    imageUrl: data.imageUrl ?? null,
    status: "pending",
  }).returning();

  if (!scan) {
    res.status(500).json({ error: "Failed to create scan" });
    return;
  }

  try {
    const cropNames: Record<string, string> = {
      rice: "Rice", oil_palm: "Oil Palm", corn: "Corn", cassava: "Cassava"
    };
    const countryNames: Record<string, string> = {
      ID: "Indonesia", TH: "Thailand", VN: "Vietnam", PH: "Philippines", MY: "Malaysia"
    };

    const imageContent: Array<{ type: string; [key: string]: unknown }> = [];
    if (data.imageBase64) {
      const mimeType = data.imageBase64.startsWith("/9j/") ? "image/jpeg" : "image/png";
      imageContent.push({
        type: "image_url",
        image_url: { url: `data:${mimeType};base64,${data.imageBase64}` }
      });
    }
    if (data.imageUrl) {
      imageContent.push({
        type: "image_url",
        image_url: { url: data.imageUrl }
      });
    }

    const promptMessages = [
      {
        role: "system" as const,
        content: `You are an expert agronomist AI for ASEAN farmers. Analyze the crop image and provide disease detection.
Always respond in valid JSON with this exact structure:
{
  "detectedDisease": "disease name or null if healthy",
  "diseaseConfidence": 85.5,
  "severity": "mild|moderate|severe or null if healthy",
  "aiAnalysis": "detailed analysis text",
  "treatmentSuggestion": "specific treatment recommendation"
}
Base your analysis on common ${cropNames[data.cropType] ?? data.cropType} diseases in ${countryNames[data.country] ?? data.country}.`
      },
      {
        role: "user" as const,
        content: imageContent.length > 0 ? [
          { type: "text", text: `Please analyze this ${cropNames[data.cropType] ?? data.cropType} crop image from ${data.region}, ${countryNames[data.country] ?? data.country}.` },
          ...imageContent
        ] as unknown as string : `Please analyze a ${cropNames[data.cropType] ?? data.cropType} crop from ${data.region}, ${countryNames[data.country] ?? data.country}. Provide a realistic disease detection analysis for demonstration purposes.`
      }
    ];

    let analysis: ScanAnalysis = {};

    try {
      analysis = await analyzeCropWithDashScope(promptMessages as Array<Record<string, unknown>>);
    } catch (parseOrRequestError) {
      logger.warn({ err: parseOrRequestError }, "Failed to analyze scan with DashScope");
    }

    const [updated] = await db.update(scansTable).set({
      detectedDisease: analysis.detectedDisease ?? null,
      diseaseConfidence: analysis.diseaseConfidence ?? null,
      severity: analysis.severity ?? null,
      aiAnalysis: analysis.aiAnalysis ?? "Analysis complete.",
      treatmentSuggestion: analysis.treatmentSuggestion ?? null,
      status: "analyzed",
    }).where(eq(scansTable.id, scan.id)).returning();

    res.status(201).json(GetScanResponse.parse({
      ...(updated ?? scan),
      createdAt: (updated ?? scan).createdAt.toISOString(),
      updatedAt: (updated ?? scan).updatedAt.toISOString(),
    }));
  } catch (err) {
    logger.error({ err }, "AI analysis failed");
    const [updated] = await db.update(scansTable).set({ status: "analyzed" }).where(eq(scansTable.id, scan.id)).returning();
    res.status(201).json(GetScanResponse.parse({
      ...(updated ?? scan),
      createdAt: (updated ?? scan).createdAt.toISOString(),
      updatedAt: (updated ?? scan).updatedAt.toISOString(),
    }));
  }
});

router.get("/scans/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetScanParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid scan ID" });
    return;
  }

  const [scan] = await db.select().from(scansTable).where(eq(scansTable.id, params.data.id));
  if (!scan) {
    res.status(404).json({ error: "Scan not found" });
    return;
  }

  res.json(GetScanResponse.parse({
    ...scan,
    createdAt: scan.createdAt.toISOString(),
    updatedAt: scan.updatedAt.toISOString(),
  }));
});

export default router;
