import { pgTable, text, varchar, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const healthCheckins = pgTable("health_checkins", {
  id: serial("id").primaryKey(),
  sessionType: text("session_type").notNull(), // morning, field, evening
  language: text("language").notNull().default("en"),
  answers: text("answers").notNull(), // JSON string of Q&A
  aiAdvice: text("ai_advice").notNull(),
  status: text("status").notNull().default("green"), // green, yellow, red
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertHealthCheckinSchema = createInsertSchema(healthCheckins).omit({
  id: true,
  createdAt: true,
});
export type InsertHealthCheckin = z.infer<typeof insertHealthCheckinSchema>;
export type HealthCheckin = typeof healthCheckins.$inferSelect;

export const diseaseDetections = pgTable("disease_detections", {
  id: serial("id").primaryKey(),
  imageUrl: text("image_url"),
  diseaseName: text("disease_name").notNull(),
  severity: text("severity").notNull().default("moderate"),
  solution: text("solution").notNull(),
  actionPlan: text("action_plan").notNull(),
  spreadInfo: text("spread_info"),
  language: text("language").notNull().default("en"),
  neighborAlerted: boolean("neighbor_alerted").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertDiseaseDetectionSchema = createInsertSchema(diseaseDetections).omit({
  id: true,
  createdAt: true,
});
export type InsertDiseaseDetection = z.infer<typeof insertDiseaseDetectionSchema>;
export type DiseaseDetection = typeof diseaseDetections.$inferSelect;

export const smsAlerts = pgTable("sms_alerts", {
  id: serial("id").primaryKey(),
  phoneNumber: text("phone_number").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // disease, health, mandi
  status: text("status").notNull().default("sent"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertSmsAlertSchema = createInsertSchema(smsAlerts).omit({
  id: true,
  createdAt: true,
});
export type InsertSmsAlert = z.infer<typeof insertSmsAlertSchema>;
export type SmsAlert = typeof smsAlerts.$inferSelect;

export const mandiPrices = pgTable("mandi_prices", {
  id: serial("id").primaryKey(),
  cropName: text("crop_name").notNull(),
  cropNameTe: text("crop_name_te"),
  cropNameHi: text("crop_name_hi"),
  minPrice: text("min_price").notNull(),
  maxPrice: text("max_price").notNull(),
  modalPrice: text("modal_price").notNull(),
  market: text("market").notNull(),
  state: text("state").notNull(),
  date: text("date").notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertMandiPriceSchema = createInsertSchema(mandiPrices).omit({
  id: true,
  updatedAt: true,
});
export type InsertMandiPrice = z.infer<typeof insertMandiPriceSchema>;
export type MandiPrice = typeof mandiPrices.$inferSelect;
