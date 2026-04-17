import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const reportsTable = pgTable("reports", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  country: text("country").notNull(),
  region: text("region").notNull(),
  reportType: text("report_type").notNull(),
  summary: text("summary").notNull(),
  totalFarmsInspected: integer("total_farms_inspected").notNull(),
  diseaseCasesFound: integer("disease_cases_found").notNull(),
  affectedAreaHectares: real("affected_area_hectares").notNull(),
  riskLevel: text("risk_level").notNull(),
  recommendations: text("recommendations"),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertReportSchema = createInsertSchema(reportsTable).omit({ id: true, createdAt: true });
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reportsTable.$inferSelect;
