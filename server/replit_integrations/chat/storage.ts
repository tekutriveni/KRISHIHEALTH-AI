import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import {
  type User,
  type InsertUser,
  type HealthCheckin,
  type InsertHealthCheckin,
  type DiseaseDetection,
  type InsertDiseaseDetection,
  type SmsAlert,
  type InsertSmsAlert,
  type MandiPrice,
  type InsertMandiPrice,
  type MarketListing,
  type InsertMarketListing,
  type Equipment,
  type InsertEquipment,
  type EquipmentBooking,
  type InsertEquipmentBooking,
  type Mill,
  type InsertMill,
  type MillSlot,
  type InsertMillSlot,
  type MillBooking,
  type InsertMillBooking,
  users,
  healthCheckins,
  diseaseDetections,
  smsAlerts,
  mandiPrices,
  marketListings,
  equipment,
  equipmentBookings,
  mills,
  millSlots,
  millBookings,
  farmers,
} from "@shared/schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createHealthCheckin(data: InsertHealthCheckin): Promise<HealthCheckin>;
  getHealthCheckins(): Promise<HealthCheckin[]>;
  createDiseaseDetection(
    data: InsertDiseaseDetection,
  ): Promise<DiseaseDetection>;
  getDiseaseDetections(): Promise<DiseaseDetection[]>;
  createSmsAlert(data: InsertSmsAlert): Promise<SmsAlert>;
  getSmsAlerts(): Promise<SmsAlert[]>;
  getMandiPrices(): Promise<MandiPrice[]>;
  upsertMandiPrices(prices: InsertMandiPrice[]): Promise<MandiPrice[]>;
  getMarketListings(): Promise<MarketListing[]>;
  createMarketListing(data: InsertMarketListing): Promise<MarketListing>;
  deleteMarketListing(id: number): Promise<void>;
  getEquipment(): Promise<Equipment[]>;
  createEquipment(data: InsertEquipment): Promise<Equipment>;
  deleteEquipment(id: number): Promise<void>;
  getBookings(): Promise<EquipmentBooking[]>;
  createBooking(data: InsertEquipmentBooking): Promise<EquipmentBooking>;
  getMills(): Promise<Mill[]>;
  getMillsByDistrict(district: string): Promise<Mill[]>;
  createMill(data: InsertMill): Promise<Mill>;
  getMillByPhone(phone: string): Promise<Mill | undefined>;
  getSlotsByMill(millId: number): Promise<MillSlot[]>;
  getAllActiveSlots(): Promise<MillSlot[]>;
  createSlot(data: InsertMillSlot): Promise<MillSlot>;
  updateSlotBookedCount(slotId: number, count: number): Promise<void>;
  deleteSlot(slotId: number): Promise<void>;
  getMillBookings(): Promise<MillBooking[]>;
  getMillBookingsBySlot(slotId: number): Promise<MillBooking[]>;
  getMillBookingsByFarmer(phone: string): Promise<MillBooking[]>;
  createMillBooking(data: InsertMillBooking): Promise<MillBooking>;  
}

export class DbStorage implements IStorage {
  // ── Users ────────────────────────────────────────────────────
  async getUser(id: string) {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }
  async getUserByUsername(username: string) {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return result[0];
  }
  async createUser(data: InsertUser): Promise<User> {
    const id = randomUUID();
    const result = await db
      .insert(users)
      .values({ ...data, id })
      .returning();
    return result[0];
  }

  // ── Health Checkins ──────────────────────────────────────────
  async createHealthCheckin(data: InsertHealthCheckin): Promise<HealthCheckin> {
    const result = await db.insert(healthCheckins).values(data).returning();
    return result[0];
  }
  async getHealthCheckins(): Promise<HealthCheckin[]> {
    return db
      .select()
      .from(healthCheckins)
      .orderBy(desc(healthCheckins.createdAt));
  }

  // ── Disease Detections ───────────────────────────────────────
  async createDiseaseDetection(
    data: InsertDiseaseDetection,
  ): Promise<DiseaseDetection> {
    const result = await db.insert(diseaseDetections).values(data).returning();
    return result[0];
  }
  async getDiseaseDetections(): Promise<DiseaseDetection[]> {
    return db
      .select()
      .from(diseaseDetections)
      .orderBy(desc(diseaseDetections.createdAt));
  }

  // ── SMS Alerts ───────────────────────────────────────────────
  async createSmsAlert(data: InsertSmsAlert): Promise<SmsAlert> {
    const result = await db.insert(smsAlerts).values(data).returning();
    return result[0];
  }
  async getSmsAlerts(): Promise<SmsAlert[]> {
    return db.select().from(smsAlerts).orderBy(desc(smsAlerts.createdAt));
  }

  // ── Mandi Prices ─────────────────────────────────────────────
  async getMandiPrices(): Promise<MandiPrice[]> {
    return db.select().from(mandiPrices);
  }
  async upsertMandiPrices(prices: InsertMandiPrice[]): Promise<MandiPrice[]> {
    await db.delete(mandiPrices);
    if (prices.length === 0) return [];
    return db.insert(mandiPrices).values(prices).returning();
  }

  // ── Market Listings ──────────────────────────────────────────
  async getMarketListings(): Promise<MarketListing[]> {
    return db
      .select()
      .from(marketListings)
      .orderBy(desc(marketListings.createdAt));
  }
  async createMarketListing(data: InsertMarketListing): Promise<MarketListing> {
    const result = await db.insert(marketListings).values(data).returning();
    return result[0];
  }
  async deleteMarketListing(id: number): Promise<void> {
    await db.delete(marketListings).where(eq(marketListings.id, id));
  }

  // ── Equipment ────────────────────────────────────────────────
  async getEquipment(): Promise<Equipment[]> {
    return db.select().from(equipment).orderBy(desc(equipment.createdAt));
  }
  async createEquipment(data: InsertEquipment): Promise<Equipment> {
    const result = await db.insert(equipment).values(data).returning();
    return result[0];
  }
  async deleteEquipment(id: number): Promise<void> {
    await db.delete(equipment).where(eq(equipment.id, id));
  }
  async getBookings(): Promise<EquipmentBooking[]> {
    return db
      .select()
      .from(equipmentBookings)
      .orderBy(desc(equipmentBookings.createdAt));
  }
  async createBooking(data: InsertEquipmentBooking): Promise<EquipmentBooking> {
    const result = await db.insert(equipmentBookings).values(data).returning();
    return result[0];
  }

  // ── Mills ────────────────────────────────────────────────────
  async getMills(): Promise<Mill[]> {
    return db.select().from(mills).where(eq(mills.active, true));
  }
  async getMillsByDistrict(district: string): Promise<Mill[]> {
    return db.select().from(mills).where(eq(mills.district, district));
  }
  async createMill(data: InsertMill): Promise<Mill> {
    const result = await db.insert(mills).values(data).returning();
    return result[0];
  }
  async getMillByPhone(phone: string): Promise<Mill | undefined> {
    const result = await db.select().from(mills).where(eq(mills.phone, phone));
    return result[0];
  }

  // ── Mill Slots ───────────────────────────────────────────────
  async getSlotsByMill(millId: number): Promise<MillSlot[]> {
    return db
      .select()
      .from(millSlots)
      .where(eq(millSlots.millId, millId))
      .orderBy(desc(millSlots.createdAt));
  }
  async getAllActiveSlots(): Promise<MillSlot[]> {
    return db
      .select()
      .from(millSlots)
      .where(eq(millSlots.active, true))
      .orderBy(desc(millSlots.createdAt));
  }
  async createSlot(data: InsertMillSlot): Promise<MillSlot> {
    const result = await db.insert(millSlots).values(data).returning();
    return result[0];
  }
  async updateSlotBookedCount(slotId: number, count: number): Promise<void> {
    await db
      .update(millSlots)
      .set({ bookedCount: count })
      .where(eq(millSlots.id, slotId));
  }
  async deleteSlot(slotId: number): Promise<void> {
    await db.delete(millSlots).where(eq(millSlots.id, slotId));
  }

  // ── Mill Bookings ────────────────────────────────────────────
  async getMillBookings(): Promise<MillBooking[]> {
    return db.select().from(millBookings).orderBy(desc(millBookings.createdAt));
  }
  async getMillBookingsBySlot(slotId: number): Promise<MillBooking[]> {
    return db
      .select()
      .from(millBookings)
      .where(eq(millBookings.slotId, slotId));
  }
  async getMillBookingsByFarmer(phone: string): Promise<MillBooking[]> {
    return db
      .select()
      .from(millBookings)
      .where(eq(millBookings.farmerPhone, phone))
      .orderBy(desc(millBookings.createdAt));
  }
  async createMillBooking(data: InsertMillBooking): Promise<MillBooking> {
    getFarmerByPhone(phone: string): Promise<any>;
    createFarmer(data: any): Promise<any>;
    const result = await db.insert(millBookings).values(data).returning();
    return result[0];
  }
}
async getFarmerByPhone(phone: string): Promise<any> {
  const result = await db.select().from(farmers).where(eq(farmers.phone, phone));
  return result[0];
}
async createFarmer(data: any): Promise<any> {
  const result = await db.insert(farmers).values(data).returning();
  return result[0];
}
export const storage = new DbStorage();
