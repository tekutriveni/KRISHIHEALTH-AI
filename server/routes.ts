import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { GoogleGenAI } from "@google/genai";
import multer from "multer";
// WhatsApp notification function
async function sendWhatsApp(to: string, message: string) {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_PHONE_NUMBER;

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: `whatsapp:${from}`,
          To: `whatsapp:+91${to}`,
          Body: message,
        }).toString(),
      },
    );
    const data = await response.json();
    console.log("WhatsApp sent:", data.sid);
  } catch (err) {
    console.error("WhatsApp error:", err);
  }
}

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,

});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

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
  if (existing.length === 0) await storage.upsertMandiPrices(MANDI_SEED);
}
seedMandiPrices();

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

function addHours(timeStr: string, hours: number): string {
  const [timePart, meridiem] = timeStr.split(" ");
  const [h] = timePart.split(":").map(Number);
  let totalHours = h + (meridiem === "PM" && h !== 12 ? 12 : 0) + hours;
  if (meridiem === "AM" && h === 12) totalHours = hours;
  const newHour = totalHours % 24;
  const newMeridiem = newHour < 12 ? "AM" : "PM";
  const displayHour =
    newHour === 0 ? 12 : newHour > 12 ? newHour - 12 : newHour;
  return `${displayHour}:00 ${newMeridiem}`;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  // ── CROP DISEASE DETECTION ────────────────────────────────────
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
                text: `${langPrefix}You are an expert Indian agricultural scientist. Analyze this crop image. Return JSON: {"diseaseName":"...","severity":"mild|moderate|severe","solution":"...","actionPlan":"...","spreadInfo":"...","medicineName":"..."} Return ONLY JSON, no markdown.`,
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
                text: `${langPrefix}You are an expert Indian agricultural scientist. A farmer asks about disease in ${cropName}. Return JSON: {"diseaseName":"...","severity":"moderate","solution":"...","actionPlan":"...","spreadInfo":"...","medicineName":"..."} Return ONLY JSON, no markdown.`,
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
      const result = JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
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
      res.status(500).json({ error: "Failed to detect disease" });
    }
  });

  app.get("/api/disease-detections", async (_req, res) => {
    const detections = await storage.getDiseaseDetections();
    res.json(detections);
  });

  // ── HEALTH CHECK-IN ───────────────────────────────────────────
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
                text: `${langPrefix}You are a health advisor for Indian farmers. Based on these answers (${sessionType} session), provide health advice.\n\n${answersText}\n\nReturn JSON: {"status":"green|yellow|red","advice":"...","statusMessage":"...","tips":["..."],"nearestPHC":"..."} Return ONLY JSON, no markdown.`,
              },
            ],
          },
        ],
        config: { maxOutputTokens: 8192 },
      });
      const text = response.text || "{}";
      const result = JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
      const checkin = await storage.createHealthCheckin({
        sessionType,
        language,
        answers: JSON.stringify(answers),
        aiAdvice: result.advice || "",
        status: result.status || "green",
      });
      res.json({ ...checkin, ...result });
    } catch (err) {
      res.status(500).json({ error: "Failed to process health check-in" });
    }
  });

  app.get("/api/health-checkins", async (_req, res) => {
    const checkins = await storage.getHealthCheckins();
    res.json(checkins);
  });

  // ── MANDI PRICES ──────────────────────────────────────────────
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
                text: `Generate realistic current mandi prices for 10 major crops in Telangana and Andhra Pradesh. Today: ${new Date().toLocaleDateString("en-IN")}. Return JSON array: [{"cropName":"...","cropNameTe":"...","cropNameHi":"...","minPrice":"...","maxPrice":"...","modalPrice":"...","market":"...","state":"...","date":"..."}] Include: Rice, Wheat, Cotton, Maize, Soybean, Groundnut, Turmeric, Chilli, Tomato, Onion. Return ONLY JSON array.`,
              },
            ],
          },
        ],
        config: { maxOutputTokens: 8192 },
      });
      const text = response.text || "[]";
      const prices = JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
      const updated = await storage.upsertMandiPrices(prices);
      res.json(updated);
    } catch (err) {
      const prices = await storage.getMandiPrices();
      res.json(prices);
    }
  });

  app.post("/api/mandi-search", async (req, res) => {
    try {
      const { query, language } = req.body;
      const langPrefix = getLanguagePromptPrefix(language || "en");
      const parseResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Extract crop name and district from: "${query}". Return ONLY JSON: {"crop":"English crop name or empty","district":"district name or empty"}`,
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
      const realPrices = await getAgmarknetPrices(crop, district);
      if (realPrices && realPrices.length > 0) {
        return res.json({
          district: district || "All India",
          crop,
          prices: realPrices,
          source: "real",
        });
      }
      const aiResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${langPrefix}You are an Indian agricultural market expert. Provide realistic mandi prices for: "${query}" (crop: ${crop}, district: ${district}). Return ONLY JSON: {"district":"...","crop":"...","prices":[{"cropName":"...","cropNameLocal":"...","minPrice":"...","maxPrice":"...","modalPrice":"...","market":"...","state":"...","date":"${new Date().toLocaleDateString("en-IN")}","advice":"...","source":"🤖 AI Estimate"}]} No markdown.`,
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
      res.status(500).json({ error: "Search failed", prices: [] });
    }
  });

  // ── INJURY DETECTION ──────────────────────────────────────────
  app.post("/api/injury-detect", upload.single("image"), async (req, res) => {
    try {
      const language = req.body.language || "en";
      const farmerName = req.body.farmerName || "Farmer";
      const familyPhone = req.body.familyPhone || "";
      const langPrefix = getLanguagePromptPrefix(language);
      const imageData = req.file?.buffer;
      const imageMime = req.file?.mimetype || "image/jpeg";
      if (!imageData)
        return res.status(400).json({ error: "No image uploaded" });
      const imageBase64 = imageData.toString("base64");
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { mimeType: imageMime, data: imageBase64 } },
              {
                text: `${langPrefix}You are a medical expert for Indian farmers. Analyze this wound/injury image. Return ONLY JSON: {"severity":"mild|moderate|severe|critical","woundType":"...","naturalRemedies":["..."],"englishMedicine":"...","timeToHeal":"...","warningIfIgnored":"...","emergencyAction":"...","smsAlert":"..."}`,
              },
            ],
          },
        ],
        config: { maxOutputTokens: 2048 },
      });
      const text = response.text || "{}";
      const result = JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
      result.smsSent = false;
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: "Failed to analyze injury" });
    }
  });

  // ── AI CHAT ───────────────────────────────────────────────────
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
                text: `${langPrefix}You are KrishiHealth AI, a helpful assistant for Indian farmers. Answer with practical, actionable advice: ${message}`,
              },
            ],
          },
        ],
        config: { maxOutputTokens: 8192 },
      });
      res.json({ reply: response.text || "" });
    } catch (err) {
      res.status(500).json({ error: "Failed to get AI response" });
    }
  });

  // ── MILL ROUTES ───────────────────────────────────────────────
  app.post("/api/mills/register", async (req, res) => {
    try {
      const existing = await storage.getMillByPhone(req.body.phone);
      if (existing)
        return res.json({ success: true, mill: existing, isExisting: true });
      const mill = await storage.createMill(req.body);
      res.json({ success: true, mill });
    } catch (err) {
      res.status(500).json({ error: "Failed to register mill" });
    }
  });

  app.post("/api/mills/login", async (req, res) => {
    try {
      const mill = await storage.getMillByPhone(req.body.phone);
      if (!mill) return res.status(404).json({ error: "Mill not found" });
      if (mill.password !== req.body.password)
        return res.status(401).json({ error: "Wrong password" });
      res.json({ success: true, mill });
    } catch (err) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.get("/api/mills", async (_req, res) => {
    const allMills = await storage.getMills();
    res.json(allMills);
  });

  app.post("/api/mills/:millId/slots", async (req, res) => {
    try {
      const slot = await storage.createSlot({
        millId: Number(req.params.millId),
        ...req.body,
      });
      res.json(slot);
    } catch (err) {
      res.status(500).json({ error: "Failed to create slot" });
    }
  });

  app.get("/api/mills/:millId/slots", async (req, res) => {
    const slots = await storage.getSlotsByMill(Number(req.params.millId));
    res.json(slots);
  });

  app.get("/api/slots", async (_req, res) => {
    const slots = await storage.getAllActiveSlots();
    res.json(slots);
  });

  app.delete("/api/slots/:slotId", async (req, res) => {
    await storage.deleteSlot(Number(req.params.slotId));
    res.json({ success: true });
  });

  app.post("/api/slots/:slotId/book", async (req, res) => {
    try {
      const slots = await storage.getAllActiveSlots();
      const slot = slots.find((s) => s.id === Number(req.params.slotId));
      if (!slot) return res.status(404).json({ error: "Slot not found" });
      if (slot.bookedCount >= slot.totalCapacity)
        return res.status(400).json({ error: "Slot full" });
      const existingBookings = await storage.getMillBookingsBySlot(slot.id);
      const tokenNumber = existingBookings.length + 1;
      const fcfsTimeStart = addHours(slot.timeStart, tokenNumber - 1);
      const fcfsTimeEnd = addHours(slot.timeStart, tokenNumber);
      // Mill owner phone తీసుకోండి
      const mills = await storage.getMills();
      const millOwner = mills.find((m) => m.id === slot.millId);
      const millOwnerPhone = millOwner?.phone || "";
      const booking = await storage.createMillBooking({
        slotId: slot.id,
        millId: slot.millId,
        millName: slot.millName,
        millPhone: req.body.millPhone || "",
        date: slot.date,
        timeStart: fcfsTimeStart,
        timeEnd: fcfsTimeEnd,
        farmerName: req.body.farmerName,
        farmerPhone: req.body.farmerPhone,
        village: req.body.village,
        quantity: req.body.quantity,
        tokenNumber,
        status: "confirmed",
      });
      await storage.updateSlotBookedCount(slot.id, slot.bookedCount + 1);

      // ఇక్కడ add చేయండి ↓
      await sendWhatsApp(
        millOwnerPhone,
        `🌾 KrishiHealth AI Alert!\n\nమీ mill కి కొత్త booking వచ్చింది!\n👤 Farmer: ${req.body.farmerName}\n📱 Phone: ${req.body.farmerPhone}\n📅 Date: ${slot.date}\n⏰ Time: ${fcfsTimeStart} - ${fcfsTimeEnd}\n🌾 Quantity: ${req.body.quantity}\n🎫 Token: #${tokenNumber}`,
      );

      res.json({ success: true, booking, tokenNumber });
    } catch (err) {
      res.status(500).json({ error: "Booking failed" });
    }
  });

  app.get("/api/mill-bookings/farmer/:phone", async (req, res) => {
    const bookings = await storage.getMillBookingsByFarmer(req.params.phone);
    res.json(bookings);
  });

  app.get("/api/slots/:slotId/bookings", async (req, res) => {
    const bookings = await storage.getMillBookingsBySlot(
      Number(req.params.slotId),
    );
    res.json(bookings);
  });

  // ── MARKET ROUTES ─────────────────────────────────────────────
  app.get("/api/market/listings", async (_req, res) => {
    const listings = await storage.getMarketListings();
    res.json(listings);
  });

  app.post("/api/market/listings", async (req, res) => {
    try {
      const listing = await storage.createMarketListing(req.body);
      // ఇక్కడ add చేయండి ↓
      await sendWhatsApp(
        listing.farmerPhone,
        `🌿 KrishiHealth AI!\n\nమీ crop listing post అయింది!\n🌾 Crop: ${listing.cropName}\n💰 Price: ₹${listing.price}\n📦 Quantity: ${listing.quantity}\n✅ Buyers మీకు contact చేస్తారు!`,
      );

      res.json(listing);
    } catch (err) {
      res.status(500).json({ error: "Failed to create listing" });
    }
  });

  app.delete("/api/market/listings/:id", async (req, res) => {
    try {
      await storage.deleteMarketListing(Number(req.params.id));
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete" });
    }
  });

  // ── EQUIPMENT ROUTES ──────────────────────────────────────────
  app.get("/api/equipment", async (_req, res) => {
    const items = await storage.getEquipment();
    res.json(items);
  });

  app.post("/api/equipment", async (req, res) => {
    try {
      const item = await storage.createEquipment(req.body);
      res.json(item);
    } catch (err) {
      res.status(500).json({ error: "Failed to add equipment" });
    }
  });

  app.delete("/api/equipment/:id", async (req, res) => {
    try {
      await storage.deleteEquipment(Number(req.params.id));
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete" });
    }
  });

  app.post("/api/equipment/:id/book", async (req, res) => {
    try {
      const items = await storage.getEquipment();
      const item = items.find((i) => i.id === Number(req.params.id));
      if (!item) return res.status(404).json({ error: "Equipment not found" });
      const booking = await storage.createBooking({
        equipmentId: item.id,
        equipmentName: item.equipmentName,
        ownerPhone: item.ownerPhone,
        farmerName: req.body.farmerName,
        farmerPhone: req.body.farmerPhone,
        date: req.body.date,
        days: req.body.days,
        totalPrice: String(Number(item.pricePerDay) * Number(req.body.days)),
      });
      // ఇక్కడ add చేయండి ↓
      await sendWhatsApp(
        item.ownerPhone,
        `🚜 KrishiHealth AI Alert!\n\nమీ equipment కి booking వచ్చింది!\n🚜 Equipment: ${item.equipmentName}\n👤 Farmer: ${req.body.farmerName}\n📱 Phone: ${req.body.farmerPhone}\n📅 Date: ${req.body.date}\n📆 Days: ${req.body.days}\n💰 Total: ₹${Number(item.pricePerDay) * Number(req.body.days)}`,
      );

      res.json(booking);
    } catch (err) {
      res.status(500).json({ error: "Failed to book" });
    }
  });

  app.get("/api/equipment/bookings", async (_req, res) => {
    const bookings = await storage.getBookings();
    res.json(bookings);
  });

  // ── FARMER ROUTES ─────────────────────────────────────────────
  app.post("/api/farmer/register", async (req, res) => {
    try {
      const {
        phone,
        name,
        village,
        cropType,
        quantity,
        quantityUnit,
        password,
      } = req.body;
      if (!phone || !name || !cropType || !quantity || !password)
        return res.status(400).json({ error: "All fields required" });

      let farmer = await storage.getFarmerByPhone(phone);
      if (farmer) {
        // Already exists — check password
        if (farmer.password !== password)
          return res.status(401).json({
            error: "Phone already registered with different password!",
          });
        return res.json({ success: true, farmer, isExisting: true });
      }

      farmer = await storage.createFarmer({
        phone,
        name,
        village: village || "",
        cropType,
        quantity,
        quantityUnit: quantityUnit || "quintal",
        password,
      });
      res.json({ success: true, farmer, isExisting: false });
    } catch (err) {
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // Login route
  app.post("/api/farmer/login", async (req, res) => {
    try {
      const { phone, password } = req.body;
      const farmer = await storage.getFarmerByPhone(phone);
      if (!farmer)
        return res.status(404).json({ error: "Phone not registered!" });
      if (farmer.password !== password)
        return res.status(401).json({ error: "Wrong password!" });
      res.json({ success: true, farmer });
    } catch (err) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  return httpServer;
}
