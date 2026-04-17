import { pgTable, text, serial, timestamp, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const scansTable = pgTable("scans", {
  id: serial("id").primaryKey(),
  cropType: text("crop_type").notNull(),
  country: text("country").notNull(),
  region: text("region").notNull(),
  farmerName: text("farmer_name"),
  imageUrl: text("image_url"),
  imageBase64: text("image_base64"),
  detectedDisease: text("detected_disease"),
  diseaseConfidence: real("disease_confidence"),
  severity: text("severity"),
  aiAnalysis: text("ai_analysis"),
  treatmentSuggestion: text("treatment_suggestion"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertScanSchema = createInsertSchema(scansTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertScan = z.infer<typeof insertScanSchema>;
export type Scan = typeof scansTable.$inferSelect;
