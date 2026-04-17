import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, reportsTable } from "@workspace/db";
import {
  CreateReportBody,
  GetReportParams,
  GetReportResponse,
  ListReportsResponseItem,
} from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
const DASHSCOPE_BASE_URL =
  process.env.DASHSCOPE_BASE_URL ?? "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";
const DASHSCOPE_TEXT_MODEL = process.env.DASHSCOPE_TEXT_MODEL ?? "qwen-plus-latest";

type ReportGeneration = {
  polishedTitle?: string;
  polishedSummary?: string;
  recommendations?: string;
};

async function generateReportText(input: {
  title: string;
  country: string;
  region: string;
  reportType: string;
  summary: string;
  totalFarmsInspected: number;
  diseaseCasesFound: number;
  affectedAreaHectares: number;
  riskLevel: string;
}): Promise<ReportGeneration> {
  if (!DASHSCOPE_API_KEY) {
    throw new Error("DASHSCOPE_API_KEY must be set to generate report text with Qwen.");
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
          content: `You write concise government crop monitoring reports for ASEAN agriculture teams.
Return valid JSON only with this exact structure:
{
  "polishedTitle": "short official report title",
  "polishedSummary": "one polished executive summary paragraph",
  "recommendations": "2 to 4 short actionable recommendation paragraphs separated by newline characters"
}
Keep the tone professional, factual, and practical. Do not invent statistics beyond the provided inputs.`,
        },
        {
          role: "user",
          content: `Draft and improve this ${input.reportType} report.
Title: ${input.title}
Country: ${input.country}
Region: ${input.region}
Risk level: ${input.riskLevel}
Farms inspected: ${input.totalFarmsInspected}
Disease cases found: ${input.diseaseCasesFound}
Affected area (hectares): ${input.affectedAreaHectares}
Raw summary: ${input.summary}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 900,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DashScope report generation failed (${response.status}): ${errorText}`);
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

  return JSON.parse(content) as ReportGeneration;
}

router.get("/reports", async (_req, res): Promise<void> => {
  const rows = await db.select().from(reportsTable).orderBy(reportsTable.createdAt);
  res.json(rows.map(r => ListReportsResponseItem.parse({
    ...r,
    createdAt: r.createdAt.toISOString(),
  })));
});

router.post("/reports", async (req, res): Promise<void> => {
  const parsed = CreateReportBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const input = parsed.data;
  let generated: ReportGeneration = {};

  try {
    generated = await generateReportText({
      title: input.title,
      country: input.country,
      region: input.region,
      reportType: input.reportType,
      summary: input.summary,
      totalFarmsInspected: input.totalFarmsInspected,
      diseaseCasesFound: input.diseaseCasesFound,
      affectedAreaHectares: input.affectedAreaHectares,
      riskLevel: input.riskLevel,
    });
  } catch (err) {
    logger.warn({ err }, "Failed to generate report text with DashScope");
  }

  const [report] = await db.insert(reportsTable).values({
    ...input,
    title: generated.polishedTitle?.trim() || input.title,
    summary: generated.polishedSummary?.trim() || input.summary,
    recommendations: generated.recommendations?.trim() || input.recommendations ?? null,
  }).returning();

  if (!report) {
    res.status(500).json({ error: "Failed to create report" });
    return;
  }

  res.status(201).json(GetReportResponse.parse({
    ...report,
    createdAt: report.createdAt.toISOString(),
  }));
});

router.get("/reports/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetReportParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid report ID" });
    return;
  }

  const [report] = await db.select().from(reportsTable).where(eq(reportsTable.id, params.data.id));
  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  res.json(GetReportResponse.parse({
    ...report,
    createdAt: report.createdAt.toISOString(),
  }));
});

export default router;
