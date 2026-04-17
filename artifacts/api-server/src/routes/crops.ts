import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, cropsTable } from "@workspace/db";
import {
  ListCropsQueryParams,
  GetCropParams,
  GetCropResponse,
  ListCropsResponseItem,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/crops", async (req, res): Promise<void> => {
  const params = ListCropsQueryParams.safeParse(req.query);
  let rows;

  if (params.success && (params.data.country || params.data.type)) {
    const conditions = [];
    if (params.data.type) conditions.push(eq(cropsTable.type, params.data.type));
    if (params.data.country) conditions.push(sql`${params.data.country} = ANY(${cropsTable.countries})`);

    rows = await db.select().from(cropsTable).where(
      conditions.length === 1
        ? conditions[0]
        : sql`${conditions[0]} AND ${conditions[1]}`
    );
  } else {
    rows = await db.select().from(cropsTable);
  }

  res.json(rows.map(r => ListCropsResponseItem.parse({
    ...r,
    createdAt: r.createdAt.toISOString(),
  })));
});

router.get("/crops/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetCropParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid crop ID" });
    return;
  }

  const [crop] = await db.select().from(cropsTable).where(eq(cropsTable.id, params.data.id));
  if (!crop) {
    res.status(404).json({ error: "Crop not found" });
    return;
  }

  res.json(GetCropResponse.parse({
    ...crop,
    createdAt: crop.createdAt.toISOString(),
  }));
});

export default router;
