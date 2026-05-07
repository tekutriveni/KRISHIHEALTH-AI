import {
  pgTable,
  text,
  varchar,
  serial,
  integer,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
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
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const insertHealthCheckinSchema = createInsertSchema(
  healthCheckins,
).omit({
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
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const insertDiseaseDetectionSchema = createInsertSchema(
  diseaseDetections,
).omit({
  id: true,
  createdAt: true,
});
export type InsertDiseaseDetection = z.infer<
  typeof insertDiseaseDetectionSchema
>;
export type DiseaseDetection = typeof diseaseDetections.$inferSelect;

export const smsAlerts = pgTable("sms_alerts", {
  id: serial("id").primaryKey(),
  phoneNumber: text("phone_number").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // disease, health, mandi
  status: text("status").notNull().default("sent"),
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
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
  updatedAt: timestamp("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const insertMandiPriceSchema = createInsertSchema(mandiPrices).omit({
  id: true,
  updatedAt: true,
});
export type InsertMandiPrice = z.infer<typeof insertMandiPriceSchema>;
export type MandiPrice = typeof mandiPrices.$inferSelect;

// ── Rice Mill Slot Booking ─────────────────────────────────────

export const mills = pgTable("mills", {
  id: serial("id").primaryKey(),
  ownerName: text("owner_name").notNull(),
  phone: text("phone").notNull(),
  millName: text("mill_name").notNull(),
  location: text("location").notNull(),
  district: text("district").notNull(),
  state: text("state").notNull().default("Telangana"),
  capacity: text("capacity").notNull().default("100"),
  password: text("password").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const millSlots = pgTable("mill_slots", {
  id: serial("id").primaryKey(),
  millId: integer("mill_id").notNull(),
  millName: text("mill_name").notNull(),
  date: text("date").notNull(),
  timeStart: text("time_start").notNull(),
  timeEnd: text("time_end").notNull(),
  totalCapacity: integer("total_capacity").notNull().default(10),
  bookedCount: integer("booked_count").notNull().default(0),
  pricePerQuintal: text("price_per_quintal").notNull().default("0"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const millBookings = pgTable("mill_bookings", {
  id: serial("id").primaryKey(),
  slotId: integer("slot_id").notNull(),
  millId: integer("mill_id").notNull(),
  millName: text("mill_name").notNull(),
  millPhone: text("mill_phone").notNull(),
  date: text("date").notNull(),
  timeStart: text("time_start").notNull(),
  timeEnd: text("time_end").notNull(),
  farmerName: text("farmer_name").notNull(),
  farmerPhone: text("farmer_phone").notNull(),
  village: text("village").notNull(),
  quantity: text("quantity").notNull(),
  tokenNumber: integer("token_number").notNull(),
  status: text("status").notNull().default("confirmed"),
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export type Mill = typeof mills.$inferSelect;
export type InsertMill = typeof mills.$inferInsert;
export type MillSlot = typeof millSlots.$inferSelect;
export type InsertMillSlot = typeof millSlots.$inferInsert;
export type MillBooking = typeof millBookings.$inferSelect;
export type InsertMillBooking = typeof millBookings.$inferInsert;
// ── Market Listings ───────────────────────────────────────────
export const marketListings = pgTable("market_listings", {
  id: serial("id").primaryKey(),
  farmerName: text("farmer_name").notNull(),
  farmerPhone: text("farmer_phone").notNull(),
  cropName: text("crop_name").notNull(),
  quantity: text("quantity").notNull(),
  unit: text("unit").notNull().default("kg"),
  pricePerUnit: text("price_per_unit").notNull(),
  location: text("location").notNull(),
  description: text("description").default(""),
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export type MarketListing = typeof marketListings.$inferSelect;
export type InsertMarketListing = typeof marketListings.$inferInsert;

// ── Equipment ─────────────────────────────────────────────────
export const equipment = pgTable("equipment", {
  id: serial("id").primaryKey(),
  ownerName: text("owner_name").notNull(),
  ownerPhone: text("owner_phone").notNull(),
  equipmentName: text("equipment_name").notNull(),
  type: text("type").notNull().default("tractor"),
  pricePerDay: text("price_per_day").notNull(),
  location: text("location").notNull(),
  available: boolean("available").notNull().default(true),
  description: text("description").default(""),
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export type Equipment = typeof equipment.$inferSelect;
export type InsertEquipment = typeof equipment.$inferInsert;

// ── Equipment Bookings ────────────────────────────────────────
export const equipmentBookings = pgTable("equipment_bookings", {
  id: serial("id").primaryKey(),
  equipmentId: integer("equipment_id").notNull(),
  equipmentName: text("equipment_name").notNull(),
  ownerPhone: text("owner_phone").notNull(),
  farmerName: text("farmer_name").notNull(),
  farmerPhone: text("farmer_phone").notNull(),
  date: text("date").notNull(),
  days: text("days").notNull(),
  totalPrice: text("total_price").notNull(),
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export type EquipmentBooking = typeof equipmentBookings.$inferSelect;
export type InsertEquipmentBooking = typeof equipmentBookings.$inferInsert;
// ── Farmers ───────────────────────────────────────────────────
export const farmers = pgTable("farmers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
  village: text("village").notNull().default(""),
  cropType: text("crop_type").notNull(),
  quantity: text("quantity").notNull(),
  quantityUnit: text("quantity_unit").notNull().default("quintal"),
  password: text("password").notNull().default(""),
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export type Farmer = typeof farmers.$inferSelect;
export type InsertFarmer = typeof farmers.$inferInsert;
