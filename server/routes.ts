import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { GoogleGenAI } from "@google/genai";
import multer from "multer";
import twilio from "twilio";
import { insertHealthCheckinSchema, insertDiseaseDetectionSchema, insertSmsAlertSchema } from "@shared/schema";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

function getTwilioClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token || !sid.startsWith("AC")) {
    throw new Error("Twilio credentials not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN.");
  }
  return twilio(sid, token);
}

const MANDI_SEED = [
  { cropName: "Rice", cropNameTe: "వరి", cropNameHi: "चावल", minPrice: "2000", maxPrice: "2500", modalPrice: "2200", market: "Hyderabad", state: "Telangana", date: new Date().toLocaleDateString("en-IN") },
  { cropName: "Wheat", cropNameTe: "గోధుమ", cropNameHi: "गेहूं", minPrice: "1800", maxPrice: "2200", modalPrice: "2000", market: "Karimnagar", state: "Telangana", date: new Date().toLocaleDateString("en-IN") },
  { cropName: "Cotton", cropNameTe: "పత్తి", cropNameHi: "कपास", minPrice: "5500", maxPrice: "6800", modalPrice: "6200", market: "Warangal", state: "Telangana", date: new Date().toLocaleDateString("en-IN") },
  { cropName: "Maize", cropNameTe: "మొక్కజొన్న", cropNameHi: "मक्का", minPrice: "1400", maxPrice: "1800", modalPrice: "1600", market: "Nizamabad", state: "Telangana", date: new Date().toLocaleDateString("en-IN") },
  { cropName: "Soybean", cropNameTe: "సోయాబీన్", cropNameHi: "सोयाबीन", minPrice: "3800", maxPrice: "4500", modalPrice: "4100", market: "Adilabad", state: "Telangana", date: new Date().toLocaleDateString("en-IN") },
  { cropName: "Groundnut", cropNameTe: "వేరుశనగ", cropNameHi: "मूंगफली", minPrice: "4200", maxPrice: "5200", modalPrice: "4800", market: "Kurnool", state: "Andhra Pradesh", date: new Date().toLocaleDateString("en-IN") },
  { cropName: "Turmeric", cropNameTe: "పసుపు", cropNameHi: "हल्दी", minPrice: "6500", maxPrice: "9000", modalPrice: "7500", market: "Nizamabad", state: "Telangana", date: new Date().toLocaleDateString("en-IN") },
  { cropName: "Chilli", cropNameTe: "మిరప", cropNameHi: "मिर्च", minPrice: "7000", maxPrice: "14000", modalPrice: "10500", market: "Guntur", state: "Andhra Pradesh", date: new Date().toLocaleDateString("en-IN") },
  { cropName: "Tomato", cropNameTe: "టమాటా", cropNameHi: "टमाटर", minPrice: "500", maxPrice: "1500", modalPrice: "900", market: "Madanapalle", state: "Andhra Pradesh", date: new Date().toLocaleDateString("en-IN") },
  { cropName: "Onion", cropNameTe: "ఉల్లిపాయ", cropNameHi: "प्याज", minPrice: "800", maxPrice: "2000", modalPrice: "1400", market: "Kurnool", state: "Andhra Pradesh", date: new Date().toLocaleDateString("en-IN") },
];

async function seedMandiPrices() {
  const existing = await storage.getMandiPrices();
  if (existing.length === 0) {
    await storage.upsertMandiPrices(MANDI_SEED);
  }
}

seedMandiPrices();

function getLanguagePromptPrefix(language: string): string {
  if (language === "te") return "Respond entirely in Telugu (తెలుగు) script. ";
  if (language === "hi") return "Respond entirely in Hindi (हिंदी) script. ";
  return "Respond in English. ";
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // --- CROP DISEASE DETECTION ---
  app.post("/api/disease-detect", upload.single("image"), async (req, res) => {
    try {
      const language = req.body.language || "en";
      const langPrefix = getLanguagePromptPrefix(language);

      const imageData = req.file?.buffer;
      const imageBase64 = imageData ? imageData.toString("base64") : null;
      const imageMime = req.file?.mimetype || "image/jpeg";

      let contents: any[];
      if (imageBase64) {
        contents = [{
          role: "user",
          parts: [
            { inlineData: { mimeType: imageMime, data: imageBase64 } },
            { text: `${langPrefix}You are an expert Indian agricultural scientist. Analyze this crop image carefully. Identify any disease present. Return a JSON object with these exact fields:
{
  "diseaseName": "name of disease (in ${language === "te" ? "Telugu" : language === "hi" ? "Hindi" : "English"})",
  "severity": "mild|moderate|severe",
  "solution": "detailed treatment and prevention solution",
  "actionPlan": "Hour 0-6: immediate action\\nHour 6-24: next steps\\nHour 24-48: follow up actions",
  "spreadInfo": "Information about how this disease spreads and which direction/conditions it spreads in",
  "medicineName": "specific medicine or fungicide to apply"
}
If no disease is found, still return JSON with diseaseName as "Healthy Crop" and appropriate advice. Return ONLY the JSON, no markdown.` }
          ]
        }];
      } else {
        const cropName = req.body.cropName || "unknown crop";
        contents = [{
          role: "user",
          parts: [{ text: `${langPrefix}You are an expert Indian agricultural scientist. A farmer is asking about disease in ${cropName}. Return a JSON object:
{
  "diseaseName": "common disease name in ${language === "te" ? "Telugu" : language === "hi" ? "Hindi" : "English"}",
  "severity": "moderate",
  "solution": "detailed treatment solution",
  "actionPlan": "Hour 0-6: immediate action\\nHour 6-24: next steps\\nHour 24-48: follow up",
  "spreadInfo": "How this disease typically spreads",
  "medicineName": "specific medicine to apply"
}
Return ONLY JSON, no markdown.` }]
        }];
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
        config: { maxOutputTokens: 8192 },
      });

      const text = response.text || "{}";
      const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
      const result = JSON.parse(cleaned);

      const detection = await storage.createDiseaseDetection({
        imageUrl: null,
        diseaseName: result.diseaseName || "Unknown",
        severity: result.severity || "moderate",
        solution: result.solution || "",
        actionPlan: result.actionPlan || "",
        spreadInfo: result.spreadInfo || "",
        language,
        neighborAlerted: false,
      });

      res.json({ ...detection, medicineName: result.medicineName });
    } catch (err) {
      console.error("Disease detect error:", err);
      res.status(500).json({ error: "Failed to detect disease" });
    }
  });

  app.get("/api/disease-detections", async (_req, res) => {
    const detections = await storage.getDiseaseDetections();
    res.json(detections);
  });

  // --- HEALTH CHECK-IN ---
  app.post("/api/health-checkin", async (req, res) => {
    try {
      const { sessionType, language, answers } = req.body;
      const langPrefix = getLanguagePromptPrefix(language);

      const answersText = Object.entries(answers)
        .map(([q, a]) => `Q: ${q}\nA: ${a}`)
        .join("\n\n");

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{
          role: "user",
          parts: [{ text: `${langPrefix}You are a health advisor for Indian farmers. Based on the following health check-in answers from a farmer (${sessionType} session), provide personalized health advice and determine a health status.

Farmer's responses:
${answersText}

Return a JSON object with:
{
  "status": "green|yellow|red",
  "advice": "personalized health advice in ${language === "te" ? "Telugu" : language === "hi" ? "Hindi" : "English"}",
  "statusMessage": "${language === "te" ? "అన్నీ బాగున్నాయి (green) | కొంచెం జాగ్రత్త అవసరం (yellow) | వెంటనే డాక్టర్ దగ్గరకు వెళ్ళండి (red)" : language === "hi" ? "सब ठीक है (green) | थोड़ी सावधानी जरूरी है (yellow) | तुरंत डॉक्टर के पास जाएं (red)" : "All good (green) | Some caution needed (yellow) | See doctor immediately (red)"}",
  "tips": ["tip1", "tip2", "tip3"],
  "nearestPHC": "Nearest PHC or hospital name if red status"
}
Return ONLY JSON, no markdown.` }]
        }],
        config: { maxOutputTokens: 8192 },
      });

      const text = response.text || "{}";
      const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
      const result = JSON.parse(cleaned);

      const checkin = await storage.createHealthCheckin({
        sessionType,
        language,
        answers: JSON.stringify(answers),
        aiAdvice: result.advice || "",
        status: result.status || "green",
      });

      res.json({ ...checkin, ...result });
    } catch (err) {
      console.error("Health checkin error:", err);
      res.status(500).json({ error: "Failed to process health check-in" });
    }
  });

  app.get("/api/health-checkins", async (_req, res) => {
    const checkins = await storage.getHealthCheckins();
    res.json(checkins);
  });

  // --- MANDI PRICES ---
  app.get("/api/mandi-prices", async (_req, res) => {
    const prices = await storage.getMandiPrices();
    res.json(prices);
  });

  app.post("/api/mandi-prices/refresh", async (req, res) => {
    try {
      const { language } = req.body;
      const langPrefix = getLanguagePromptPrefix(language || "en");

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{
          role: "user",
          parts: [{ text: `${langPrefix}You are an agricultural market expert. Generate realistic current mandi (wholesale market) prices for 10 major crops in Telangana and Andhra Pradesh, India. Today's date: ${new Date().toLocaleDateString("en-IN")}. 

Return a JSON array:
[
  {
    "cropName": "English name",
    "cropNameTe": "Telugu name in Telugu script",
    "cropNameHi": "Hindi name in Hindi script",
    "minPrice": "minimum price in INR per quintal as string",
    "maxPrice": "maximum price in INR per quintal as string",
    "modalPrice": "modal/average price in INR per quintal as string",
    "market": "market name in Telangana/AP",
    "state": "Telangana or Andhra Pradesh",
    "date": "${new Date().toLocaleDateString("en-IN")}"
  }
]
Include: Rice, Wheat, Cotton, Maize, Soybean, Groundnut, Turmeric, Chilli, Tomato, Onion.
Return ONLY JSON array, no markdown.` }]
        }],
        config: { maxOutputTokens: 8192 },
      });

      const text = response.text || "[]";
      const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
      const prices = JSON.parse(cleaned);
      const updated = await storage.upsertMandiPrices(prices);
      res.json(updated);
    } catch (err) {
      console.error("Mandi refresh error:", err);
      const prices = await storage.getMandiPrices();
      res.json(prices);
    }
  });

  // --- SMS ALERTS ---
  app.post("/api/sms/send", async (req, res) => {
    try {
      const { phoneNumber, message, type } = req.body;
      const fromNumber = process.env.TWILIO_PHONE_NUMBER;

      await getTwilioClient().messages.create({
        body: message,
        from: fromNumber,
        to: phoneNumber,
      });

      const alert = await storage.createSmsAlert({
        phoneNumber,
        message,
        type,
        status: "sent",
      });

      res.json({ success: true, alert });
    } catch (err: any) {
      console.error("SMS error:", err);
      res.status(500).json({ error: err.message || "Failed to send SMS" });
    }
  });

  app.post("/api/sms/send-group", async (req, res) => {
    try {
      const { phoneNumbers, message, type } = req.body;
      const fromNumber = process.env.TWILIO_PHONE_NUMBER;
      const results = [];

      for (const phone of phoneNumbers) {
        try {
          await getTwilioClient().messages.create({ body: message, from: fromNumber, to: phone });
          const alert = await storage.createSmsAlert({ phoneNumber: phone, message, type, status: "sent" });
          results.push({ phone, success: true, alert });
        } catch (e: any) {
          results.push({ phone, success: false, error: e.message });
        }
      }

      res.json({ results });
    } catch (err: any) {
      console.error("Group SMS error:", err);
      res.status(500).json({ error: "Failed to send group SMS" });
    }
  });

  app.get("/api/sms-alerts", async (_req, res) => {
    const alerts = await storage.getSmsAlerts();
    res.json(alerts);
  });

  // --- AI CHAT (general) ---
  app.post("/api/ai-chat", async (req, res) => {
    try {
      const { message, language } = req.body;
      const langPrefix = getLanguagePromptPrefix(language);

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{
          role: "user",
          parts: [{ text: `${langPrefix}You are KrishiHealth AI, a helpful assistant for Indian farmers. Answer the following question with practical, actionable advice relevant to Indian farming: ${message}` }]
        }],
        config: { maxOutputTokens: 8192 },
      });

      res.json({ reply: response.text || "" });
    } catch (err) {
      console.error("AI chat error:", err);
      res.status(500).json({ error: "Failed to get AI response" });
    }
  });

  return httpServer;
}
