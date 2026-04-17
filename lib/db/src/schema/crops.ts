import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const cropsTable = pgTable("crops", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  localName: text("local_name"),
  type: text("type").notNull(),
  countries: text("countries").array().notNull(),
  commonDiseases: text("common_diseases").array().notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCropSchema = createInsertSchema(cropsTable).omit({ id: true, createdAt: true });
export type InsertCrop = z.infer<typeof insertCropSchema>;
export type Crop = typeof cropsTable.$inferSelect;
