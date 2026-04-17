import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const recommendationsTable = pgTable("recommendations", {
  id: serial("id").primaryKey(),
  scanId: integer("scan_id").notNull(),
  disease: text("disease").notNull(),
  cropType: text("crop_type").notNull(),
  country: text("country").notNull(),
  fertilizerName: text("fertilizer_name").notNull(),
  fertilizerType: text("fertilizer_type").notNull(),
  applicationMethod: text("application_method").notNull(),
  dosage: text("dosage").notNull(),
  localAvailability: text("local_availability"),
  subsidized: boolean("subsidized").notNull().default(false),
  aiGuidance: text("ai_guidance").notNull(),
  additionalNotes: text("additional_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRecommendationSchema = createInsertSchema(recommendationsTable).omit({ id: true, createdAt: true });
export type InsertRecommendation = z.infer<typeof insertRecommendationSchema>;
export type Recommendation = typeof recommendationsTable.$inferSelect;
