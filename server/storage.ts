import {
  type User, type InsertUser,
  type HealthCheckin, type InsertHealthCheckin,
  type DiseaseDetection, type InsertDiseaseDetection,
  type SmsAlert, type InsertSmsAlert,
  type MandiPrice, type InsertMandiPrice,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  createHealthCheckin(data: InsertHealthCheckin): Promise<HealthCheckin>;
  getHealthCheckins(): Promise<HealthCheckin[]>;

  createDiseaseDetection(data: InsertDiseaseDetection): Promise<DiseaseDetection>;
  getDiseaseDetections(): Promise<DiseaseDetection[]>;

  createSmsAlert(data: InsertSmsAlert): Promise<SmsAlert>;
  getSmsAlerts(): Promise<SmsAlert[]>;

  getMandiPrices(): Promise<MandiPrice[]>;
  upsertMandiPrices(prices: InsertMandiPrice[]): Promise<MandiPrice[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private healthCheckins: Map<number, HealthCheckin> = new Map();
  private diseaseDetections: Map<number, DiseaseDetection> = new Map();
  private smsAlerts: Map<number, SmsAlert> = new Map();
  private mandiPrices: Map<number, MandiPrice> = new Map();
  private nextId = 1;

  async getUser(id: string) { return this.users.get(id); }
  async getUserByUsername(username: string) {
    return Array.from(this.users.values()).find(u => u.username === username);
  }
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createHealthCheckin(data: InsertHealthCheckin): Promise<HealthCheckin> {
    const id = this.nextId++;
    const checkin: HealthCheckin = {
      ...data,
      id,
      createdAt: new Date(),
    };
    this.healthCheckins.set(id, checkin);
    return checkin;
  }
  async getHealthCheckins(): Promise<HealthCheckin[]> {
    return Array.from(this.healthCheckins.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async createDiseaseDetection(data: InsertDiseaseDetection): Promise<DiseaseDetection> {
    const id = this.nextId++;
    const detection: DiseaseDetection = {
      ...data,
      id,
      createdAt: new Date(),
    };
    this.diseaseDetections.set(id, detection);
    return detection;
  }
  async getDiseaseDetections(): Promise<DiseaseDetection[]> {
    return Array.from(this.diseaseDetections.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async createSmsAlert(data: InsertSmsAlert): Promise<SmsAlert> {
    const id = this.nextId++;
    const alert: SmsAlert = {
      ...data,
      id,
      createdAt: new Date(),
    };
    this.smsAlerts.set(id, alert);
    return alert;
  }
  async getSmsAlerts(): Promise<SmsAlert[]> {
    return Array.from(this.smsAlerts.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async getMandiPrices(): Promise<MandiPrice[]> {
    return Array.from(this.mandiPrices.values());
  }
  async upsertMandiPrices(prices: InsertMandiPrice[]): Promise<MandiPrice[]> {
    this.mandiPrices.clear();
    const result: MandiPrice[] = [];
    for (const p of prices) {
      const id = this.nextId++;
      const price: MandiPrice = { ...p, id, updatedAt: new Date() };
      this.mandiPrices.set(id, price);
      result.push(price);
    }
    return result;
  }
}

export const storage = new MemStorage();
