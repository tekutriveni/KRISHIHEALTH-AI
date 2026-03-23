import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { GoogleGenAI } from "@google/genai";
import multer from "multer";
import {
  insertHealthCheckinSchema,
  insertDiseaseDetectionSchema,
  insertSmsAlertSchema,
} from "@shared/schema";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ── FAST2SMS ──────────────────────────────────────────────────────────────────
async function sendFast2SMS(phoneNumber: string, message: string) {
  try {
    const apiKey = process.env.FAST2SMS_API_KEY;
    if (!apiKey) throw new Error("Fast2SMS API key not configured");

    const cleanPhone = phoneNumber
      .replace(/\+91/g, "")
      .replace(/\s/g, "")
      .replace(/-/g, "");

    const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        route: "q",
        message: message,
        language: "english",
        flash: 0,
        numbers: cleanPhone,
      }),
    });

    const data = await response.json();
    if (data.return === true) {
      return { success: true };
    } else {
      throw new Error(data.message?.[0] || "SMS failed");
    }
  } catch (err: any) {
    console.error("Fast2SMS error:", err);
    throw err;
  }
}

// ── AGMARKNET ─────────────────────────────────────────────────────────────────
async function getAgmarknetPrices(crop?: string, district?: string) {
  try {
    const apiKey = process.env.AGMARKNET_API_KEY;
    if (!apiKey) return null;

    let url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${apiKey}&format=json&limit=20`;

    if (crop) url += `&filters[commodity]=${encodeURIComponent(crop)}`;
    if (district) url += `&filters[district]=${encodeURIComponent(district)}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.records || data.records.length === 0) return null;

    return data.records.map((r: any) => ({
      cropName: r.commodity,
      cropNameLocal: r.commodity,
      minPrice: r.min_price,
      maxPrice: r.max_price,
      modalPrice: r.modal_price,
      market: r.market,
      state: r.state,
      district: r.district,
      date: r.arrival_date,
      source: "✅ Agmarknet Real Data",
    }));
  } catch (err) {
    console.error("Agmarknet error:", err);
    return null;
  }
}

const MANDI_SEED = [
  {
    cropName: "Rice",
    cropNameTe: "వరి",
    cropNameHi: "चावल",
    minPrice: "2000",
    maxPrice: "2500",
    modalPrice: "2200",
    market: "Hyderabad",
    state: "Telangana",
    date: new Date().toLocaleDateString("en-IN"),
  },
  {
    cropName: "Wheat",
    cropNameTe: "గోధుమ",
    cropNameHi: "गेहूं",
    minPrice: "1800",
    maxPrice: "2200",
    modalPrice: "2000",
    market: "Karimnagar",
    state: "Telangana",
    date: new Date().toLocaleDateString("en-IN"),
  },
  {
    cropName: "Cotton",
    cropNameTe: "పత్తి",
    cropNameHi: "कपास",
    minPrice: "5500",
    maxPrice: "6800",
    modalPrice: "6200",
    market: "Warangal",
    state: "Telangana",
    date: new Date().toLocaleDateString("en-IN"),
  },
  {
    cropName: "Maize",
    cropNameTe: "మొక్కజొన్న",
    cropNameHi: "मक्का",
    minPrice: "1400",
    maxPrice: "1800",
    modalPrice: "1600",
    market: "Nizamabad",
    state: "Telangana",
    date: new Date().toLocaleDateString("en-IN"),
  },
  {
    cropName: "Soybean",
    cropNameTe: "సోయాబీన్",
    cropNameHi: "सोयाबीन",
    minPrice: "3800",
    maxPrice: "4500",
    modalPrice: "4100",
    market: "Adilabad",
    state: "Telangana",
    date: new Date().toLocaleDateString("en-IN"),
  },
  {
    cropName: "Groundnut",
    cropNameTe: "వేరుశనగ",
    cropNameHi: "मूंगफली",
    minPrice: "4200",
    maxPrice: "5200",
    modalPrice: "4800",
    market: "Kurnool",
    state: "Andhra Pradesh",
    date: new Date().toLocaleDateString("en-IN"),
  },
  {
    cropName: "Turmeric",
    cropNameTe: "పసుపు",
    cropNameHi: "हल्दी",
    minPrice: "6500",
    maxPrice: "9000",
    modalPrice: "7500",
    market: "Nizamabad",
    state: "Telangana",
    date: new Date().toLocaleDateString("en-IN"),
  },
  {
    cropName: "Chilli",
    cropNameTe: "మిరప",
    cropNameHi: "मिर्च",
    minPrice: "7000",
    maxPrice: "14000",
    modalPrice: "10500",
    market: "Guntur",
    state: "Andhra Pradesh",
    date: new Date().toLocaleDateString("en-IN"),
  },
  {
    cropName: "Tomato",
    cropNameTe: "టమాటా",
    cropNameHi: "टमाटर",
    minPrice: "500",
    maxPrice: "1500",
    modalPrice: "900",
    market: "Madanapalle",
    state: "Andhra Pradesh",
    date: new Date().toLocaleDateString("en-IN"),
  },
  {
    cropName: "Onion",
    cropNameTe: "ఉల్లిపాయ",
    cropNameHi: "प्याज",
    minPrice: "800",
    maxPrice: "2000",
    modalPrice: "1400",
    market: "Kurnool",
    state: "Andhra Pradesh",
    date: new Date().toLocaleDateString("en-IN"),
  },
];

async function seedMandiPrices() {
  const existing = await storage.getMandiPrices();
  if (existing.length === 0) {
    await storage.upsertMandiPrices(MANDI_SEED);
  }
}

seedMandiPrices();

// ── 17 LANGUAGES ──────────────────────────────────────────────────────────────
function getLanguagePromptPrefix(language: string): string {
  const langNames: Record<string, string> = {
    en: "English",
    te: "Telugu (తెలుగు)",
    hi: "Hindi (हिंदी)",
    bn: "Bengali (বাংলা)",
    ta: "Tamil (தமிழ்)",
    mr: "Marathi (मराठी)",
    gu: "Gujarati (ગુજરાતી)",
    kn: "Kannada (ಕನ್ನಡ)",
    ml: "Malayalam (മലയാളം)",
    pa: "Punjabi (ਪੰਜਾਬੀ)",
    ur: "Urdu (اردو)",
    or: "Odia (ଓଡ଼ିଆ)",
    as: "Assamese (অসমীয়া)",
    ne: "Nepali (नेपाली)",
    sd: "Sindhi (سنڌي)",
    mai: "Maithili (मैथिली)",
    kok: "Konkani (कोंकणी)",
  };
  const name = langNames[language] || "English";
  return `You MUST respond entirely in ${name} language and script only. Every word must be in ${name}. `;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  // ── CROP DISEASE DETECTION ────────────────────────────────────────────────
  app.post("/api/disease-detect", upload.single("image"), async (req, res) => {
    try {
      const language = req.body.language || "en";
      const langPrefix = getLanguagePromptPrefix(language);
      const imageData = req.file?.buffer;
      const imageBase64 = imageData ? imageData.toString("base64") : null;
      const imageMime = req.file?.mimetype || "image/jpeg";

      let contents: any[];
      if (imageBase64) {
        contents = [
          {
            role: "user",
            parts: [
              { inlineData: { mimeType: imageMime, data: imageBase64 } },
              {
                text: `${langPrefix}You are an expert Indian agricultural scientist. Analyze this crop image carefully. Identify any disease present. Return a JSON object:
{
  "diseaseName": "name of disease in the language specified above",
  "severity": "mild|moderate|severe",
  "solution": "detailed treatment and prevention solution in the language specified above",
  "actionPlan": "Hour 0-6: immediate action\\nHour 6-24: next steps\\nHour 24-48: follow up actions (all in the language specified above)",
  "spreadInfo": "Information about how this disease spreads in the language specified above",
  "medicineName": "specific medicine name in English, explanation in the language specified above"
}
If no disease found, return JSON with diseaseName as Healthy Crop in the language specified above.
Return ONLY JSON, no markdown.`,
              },
            ],
          },
        ];
      } else {
        const cropName = req.body.cropName || "unknown crop";
        contents = [
          {
            role: "user",
            parts: [
              {
                text: `${langPrefix}You are an expert Indian agricultural scientist. A farmer asks about disease in ${cropName}. Return a JSON object:
{
  "diseaseName": "common disease name in the language specified above",
  "severity": "moderate",
  "solution": "detailed treatment solution in the language specified above",
  "actionPlan": "Hour 0-6: action\\nHour 6-24: steps\\nHour 24-48: follow up (in the language specified above)",
  "spreadInfo": "How this disease spreads in the language specified above",
  "medicineName": "medicine name in English, explanation in the language specified above"
}
Return ONLY JSON, no markdown.`,
              },
            ],
          },
        ];
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

  // ── HEALTH CHECK-IN ───────────────────────────────────────────────────────
  app.post("/api/health-checkin", async (req, res) => {
    try {
      const { sessionType, language, answers } = req.body;
      const langPrefix = getLanguagePromptPrefix(language);

      const answersText = Object.entries(answers)
        .map(([q, a]) => `Q: ${q}\nA: ${a}`)
        .join("\n\n");

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${langPrefix}You are a health advisor for Indian farmers. Based on these health check-in answers (${sessionType} session), provide personalized health advice.

Farmer's responses:
${answersText}

Return a JSON object:
{
  "status": "green|yellow|red",
  "advice": "personalized health advice in the language specified above",
  "statusMessage": "status message in the language specified above (green=all good, yellow=caution, red=see doctor)",
  "tips": ["tip1 in the language specified above", "tip2", "tip3"],
  "nearestPHC": "Nearest PHC or hospital name if red status"
}
Return ONLY JSON, no markdown.`,
              },
            ],
          },
        ],
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

  // ── MANDI PRICES ──────────────────────────────────────────────────────────
  app.get("/api/mandi-prices", async (_req, res) => {
    const prices = await storage.getMandiPrices();
    res.json(prices);
  });

  app.post("/api/mandi-prices/refresh", async (req, res) => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Generate realistic current mandi prices for 10 major crops in Telangana and Andhra Pradesh, India. Today: ${new Date().toLocaleDateString("en-IN")}.
Return JSON array:
[{"cropName":"English name","cropNameTe":"Telugu","cropNameHi":"Hindi","minPrice":"number","maxPrice":"number","modalPrice":"number","market":"market name","state":"Telangana or AP","date":"${new Date().toLocaleDateString("en-IN")}"}]
Include: Rice, Wheat, Cotton, Maize, Soybean, Groundnut, Turmeric, Chilli, Tomato, Onion.
Return ONLY JSON array, no markdown.`,
              },
            ],
          },
        ],
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

  // ── MANDI SEARCH — All India ──────────────────────────────────────────────
  app.post("/api/mandi-search", async (req, res) => {
    try {
      const { query, language } = req.body;
      const langPrefix = getLanguagePromptPrefix(language || "en");

      // Step 1 — AI parse crop + district
      const parseResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Extract crop name and district from: "${query}"
Return ONLY JSON: {"crop": "English crop name or empty", "district": "district name or empty"}`,
              },
            ],
          },
        ],
        config: { maxOutputTokens: 200 },
      });

      const parsed = JSON.parse(
        (parseResponse.text || "{}").replace(/```json\n?|\n?```/g, "").trim(),
      );

      const crop = parsed.crop || "";
      const district = parsed.district || "";

      // Step 2 — Agmarknet real data
      const realPrices = await getAgmarknetPrices(crop, district);

      if (realPrices && realPrices.length > 0) {
        return res.json({
          district: district || "All India",
          crop,
          prices: realPrices,
          source: "real",
        });
      }

      // Step 3 — AI fallback
      const aiResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${langPrefix}You are an Indian agricultural market expert. Provide realistic mandi prices for: "${query}" (crop: ${crop}, district: ${district})

Return ONLY JSON:
{
  "district": "${district || "India"}",
  "crop": "${crop}",
  "prices": [{
    "cropName": "English name",
    "cropNameLocal": "name in language specified above",
    "minPrice": "number string",
    "maxPrice": "number string",
    "modalPrice": "number string",
    "market": "specific mandi name",
    "state": "state name",
    "date": "${new Date().toLocaleDateString("en-IN")}",
    "advice": "1 line sell/wait advice in language specified above",
    "source": "🤖 AI Estimate"
  }]
}
No markdown.`,
              },
            ],
          },
        ],
        config: { maxOutputTokens: 2048 },
      });

      const aiResult = JSON.parse(
        (aiResponse.text || "{}").replace(/```json\n?|\n?```/g, "").trim(),
      );

      res.json({ ...aiResult, source: "ai" });
    } catch (err) {
      console.error("Mandi search error:", err);
      res.status(500).json({ error: "Search failed", prices: [] });
    }
  });

  // ── SMS ALERTS — Fast2SMS ─────────────────────────────────────────────────
  app.get("/api/sms/status", (_req, res) => {
    const fast2sms = process.env.FAST2SMS_API_KEY;
    const configured = !!fast2sms;
    res.json({
      configured,
      reason: !configured
        ? "FAST2SMS_API_KEY not set in Replit Secrets."
        : null,
    });
  });

  app.post("/api/sms/send", async (req, res) => {
    try {
      const { phoneNumber, message, type } = req.body;

      await sendFast2SMS(phoneNumber, message);

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
      const results = [];

      for (const phone of phoneNumbers) {
        try {
          await sendFast2SMS(phone, message);
          const alert = await storage.createSmsAlert({
            phoneNumber: phone,
            message,
            type,
            status: "sent",
          });
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

  // ── AI CHAT ───────────────────────────────────────────────────────────────
  app.post("/api/ai-chat", async (req, res) => {
    try {
      const { message, language } = req.body;
      const langPrefix = getLanguagePromptPrefix(language);

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${langPrefix}You are KrishiHealth AI, a helpful assistant for Indian farmers. Answer this question with practical, actionable advice: ${message}`,
              },
            ],
          },
        ],
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
