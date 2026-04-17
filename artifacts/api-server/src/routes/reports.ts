import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, reportsTable } from "@workspace/db";
import {
  CreateReportBody,
  GetReportParams,
  GetReportResponse,
  ListReportsResponseItem,
} from "@workspace/api-zod";

const router: IRouter = Router();

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

  const [report] = await db.insert(reportsTable).values(parsed.data).returning();

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
