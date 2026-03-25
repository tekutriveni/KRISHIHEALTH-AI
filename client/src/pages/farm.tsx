import { useState, useEffect } from "react";
import {
  Calendar,
  Leaf,
  Calculator,
  Bug,
  TrendingUp,
  Droplets,
  Loader2,
  RefreshCw,
  Newspaper,
  Sprout,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Language } from "@/lib/language";

interface FarmProps {
  language: Language;
}
function speakText(text: string, language: Language) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang =
    language === "te" ? "te-IN" : language === "hi" ? "hi-IN" : "en-IN";
  utterance.rate = 0.85;
  window.speechSynthesis.speak(utterance);
}

function VoiceButton({ text, language }: { text: string; language: Language }) {
  const [speaking, setSpeaking] = useState(false);
  function toggle() {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang =
        language === "te" ? "te-IN" : language === "hi" ? "hi-IN" : "en-IN";
      utterance.rate = 0.85;
      utterance.onend = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setSpeaking(true);
    }
  }
  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
        speaking
          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
          : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
      }`}
    >
      {speaking ? "⏹ Stop" : "🔊 Voice"}
    </button>
  );
}
const CROPS: Record<Language, string[]> = {
  te: [
    "వరి",
    "గోధుమ",
    "పత్తి",
    "మొక్కజొన్న",
    "మిరప",
    "టమాటా",
    "ఉల్లిపాయ",
    "సోయాబీన్",
    "వేరుశనగ",
    "పసుపు",
  ],
  hi: [
    "चावल",
    "गेहूं",
    "कपास",
    "मक्का",
    "मिर्च",
    "टमाटर",
    "प्याज",
    "सोयाबीन",
    "मूंगफली",
    "हल्दी",
  ],
  en: [
    "Rice",
    "Wheat",
    "Cotton",
    "Maize",
    "Chilli",
    "Tomato",
    "Onion",
    "Soybean",
    "Groundnut",
    "Turmeric",
  ],
};
interface NewsItem {
  title: string;
  summary: string;
  category: string;
  emoji: string;
  importance: "high" | "medium" | "low";
  date: string;
  state: string;
}

async function askAI(message: string, language: Language): Promise<string> {
  const res = await fetch("/api/ai-chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, language }),
  });
  const data = await res.json();
  return data.reply || "";
}

function SectionHeader({
  icon: Icon,
  title,
  color,
}: {
  icon: any;
  title: string;
  color: string;
}) {
  return (
    <div
      className={`flex items-center gap-2 p-3 rounded-lg ${color} text-white font-bold text-base mb-3`}
    >
      <Icon size={20} />
      {title}
    </div>
  );
}
function ResultBox({
  result,
  color,
  language,
}: {
  result: string;
  color: string;
  language: Language;
}) {
  return (
    <div
      className={`rounded-lg p-3 text-sm whitespace-pre-wrap border ${color} mt-2`}
    >
      <div className="flex justify-end mb-2">
        <VoiceButton text={result} language={language} />
      </div>
      {result}
    </div>
  );
}

export default function Farm({ language }: FarmProps) {
  const [tab, setTab] = useState<"guide" | "news">("guide");
  const crops = CROPS[language] || CROPS.en;
  const langName =
    language === "te" ? "Telugu" : language === "hi" ? "Hindi" : "English";

  const L = (te: string, hi: string, en: string) =>
    language === "te" ? te : language === "hi" ? hi : en;

  // ── Crop Calendar ──────────────────────────────────────────────
  const [calCrop, setCalCrop] = useState(crops[0]);
  const [calResult, setCalResult] = useState("");
  const [calLoading, setCalLoading] = useState(false);

  async function loadCalendar() {
    setCalLoading(true);
    const r = await askAI(
      `You are an expert Indian agricultural scientist. Give complete crop calendar for ${calCrop} in Telangana/Andhra Pradesh. Include: sowing time, irrigation schedule, fertilizer schedule, pest control timing, harvesting time. Respond in ${langName} only. Use clear sections.`,
      language,
    );
    setCalResult(r);
    setCalLoading(false);
  }

  // ── Fertilizer Calculator ──────────────────────────────────────
  const [fertCrop, setFertCrop] = useState(crops[0]);
  const [fertAcres, setFertAcres] = useState("1");
  const [fertSoil, setFertSoil] = useState("black");
  const [fertResult, setFertResult] = useState("");
  const [fertLoading, setFertLoading] = useState(false);

  async function calcFertilizer() {
    setFertLoading(true);
    const r = await askAI(
      `You are an expert Indian agronomist. Calculate fertilizer for: Crop=${fertCrop}, Area=${fertAcres} acres, Soil=${fertSoil} in Telangana/AP. Give exact NPK kg per acre, total for ${fertAcres} acres, Indian brand names, application timing. Respond in ${langName} only.`,
      language,
    );
    setFertResult(r);
    setFertLoading(false);
  }

  // ── Pest Guide ─────────────────────────────────────────────────
  const [pestCrop, setPestCrop] = useState(crops[0]);
  const [pestName, setPestName] = useState("");
  const [pestResult, setPestResult] = useState("");
  const [pestLoading, setPestLoading] = useState(false);

  async function getPestGuide() {
    setPestLoading(true);
    const r = await askAI(
      `You are an expert Indian entomologist. Give complete pest guide for ${pestCrop}${pestName ? `, about ${pestName}` : ""}. Include: common pests, identification, damage symptoms, organic remedies, chemical pesticides (Indian brands), prevention. Respond in ${langName} only.`,
      language,
    );
    setPestResult(r);
    setPestLoading(false);
  }

  // ── Profit Calculator ──────────────────────────────────────────
  const [profitCrop, setProfitCrop] = useState(crops[0]);
  const [profitAcres, setProfitAcres] = useState("1");
  const [seedCost, setSeedCost] = useState("");
  const [labourCost, setLabourCost] = useState("");
  const [otherCost, setOtherCost] = useState("");
  const [profitResult, setProfitResult] = useState("");
  const [profitLoading, setProfitLoading] = useState(false);

  async function calcProfit() {
    setProfitLoading(true);
    const total =
      (Number(seedCost) || 0) +
      (Number(labourCost) || 0) +
      (Number(otherCost) || 0);
    const r = await askAI(
      `You are an agricultural economist. Calculate crop profit: Crop=${profitCrop}, Area=${profitAcres} acres, Investment=₹${total} (Seed=₹${seedCost}, Labour=₹${labourCost}, Other=₹${otherCost}). Use current Telangana/AP mandi prices. Give: expected yield, revenue, profit/loss, break-even, tips. Respond in ${langName} only.`,
      language,
    );
    setProfitResult(r);
    setProfitLoading(false);
  }

  // ── Soil Health ────────────────────────────────────────────────
  const [soilColor, setSoilColor] = useState("black");
  const [soilMoisture, setSoilMoisture] = useState("medium");
  const [soilCrop, setSoilCrop] = useState(crops[0]);
  const [soilResult, setSoilResult] = useState("");
  const [soilLoading, setSoilLoading] = useState(false);

  async function checkSoil() {
    setSoilLoading(true);
    const r = await askAI(
      `You are a soil scientist for Indian farmers. Analyze: Soil color=${soilColor}, Moisture=${soilMoisture}, Crop=${soilCrop}, Location=Telangana/AP. Give: soil type, pH range, fertility, amendments, best crops, organic improvement tips. Respond in ${langName} only.`,
      language,
    );
    setSoilResult(r);
    setSoilLoading(false);
  }

  // ── Irrigation ─────────────────────────────────────────────────
  const [irrCrop, setIrrCrop] = useState(crops[0]);
  const [irrMethod, setIrrMethod] = useState("flood");
  const [irrAcres, setIrrAcres] = useState("1");
  const [irrResult, setIrrResult] = useState("");
  const [irrLoading, setIrrLoading] = useState(false);

  async function getIrrigation() {
    setIrrLoading(true);
    const r = await askAI(
      `You are an irrigation expert for Indian farmers. Guide for: Crop=${irrCrop}, Method=${irrMethod}, Area=${irrAcres} acres, Telangana/AP. Include: water per acre, frequency, best time, water saving tips, stage-wise schedule. Respond in ${langName} only.`,
      language,
    );
    setIrrResult(r);
    setIrrLoading(false);
  }

  // ── News ───────────────────────────────────────────────────────
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");

  useEffect(() => {
    if (tab === "news" && newsList.length === 0) fetchNews();
  }, [tab]);
  async function fetchNews() {
    setNewsLoading(true);
    try {
      const today = new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const r = await askAI(
        `You are a farming news editor for Indian farmers. Generate 10 important farming news for today ${today}. Cover ALL Indian states — Punjab wheat, Maharashtra cotton, UP sugarcane, Kerala rubber, Karnataka ragi, Bihar rice, Rajasthan mustard, MP soybean, Gujarat groundnut, Odisha paddy. Also include: PM-KISAN, crop insurance, weather warnings, pest outbreaks, agri technology, export/import news. Return ONLY JSON array (no markdown): [{"title":"headline in ${langName}","summary":"2-3 line summary in ${langName}","category":"MSP|Weather|Scheme|Technology|Pest|Export|Irrigation|Organic","emoji":"emoji","importance":"high|medium|low","date":"${today}","state":"state name in ${langName}"}]`,
        language,
      );
      const cleaned = r.replace(/```json\n?|\n?```/g, "").trim();
      setNewsList(JSON.parse(cleaned));
      setLastUpdated(
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    } catch {
      setNewsList([]);
    }
    setNewsLoading(false);
  }

  const categoryColor: Record<string, string> = {
    MSP: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    Weather: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    Scheme:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    Technology:
      "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
    Pest: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    Export:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    Irrigation: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
    Organic: "bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-300",
  };

  const SelectField = ({ label, value, onChange, children }: any) => (
    <div>
      <label className="text-xs font-medium">{label}</label>
      <select
        className="w-full mt-1 border rounded-lg p-2 text-sm bg-background"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {children}
      </select>
    </div>
  );

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-700 to-green-800 rounded-xl p-4 text-white">
        <h1 className="text-xl font-bold flex items-center gap-2">
          🌾 {L("వ్యవసాయ & వార్తలు", "कृषि & समाचार", "Farm Guide & News")}
        </h1>
        <p className="text-sm opacity-90 mt-1">
          {L(
            "అన్ని వ్యవసాయ సమాచారం + తాజా వార్తలు",
            "सभी जानकारी + ताजा खबरें",
            "All farm info + latest news",
          )}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl overflow-hidden border">
        <button
          onClick={() => setTab("guide")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold transition-colors ${
            tab === "guide"
              ? "bg-green-600 text-white"
              : "bg-background text-muted-foreground hover:bg-muted"
          }`}
        >
          <Sprout size={16} />
          {L("వ్యవసాయ గైడ్", "कृषि गाइड", "Farm Guide")}
        </button>
        <button
          onClick={() => setTab("news")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold transition-colors ${
            tab === "news"
              ? "bg-blue-700 text-white"
              : "bg-background text-muted-foreground hover:bg-muted"
          }`}
        >
          <Newspaper size={16} />
          {L("వ్యవసాయ వార్తలు", "कृषि समाचार", "Farming News")}
        </button>
      </div>

      {/* ═══════════════ FARM GUIDE TAB ═══════════════ */}
      {tab === "guide" && (
        <div className="space-y-5">
          {/* 1. Crop Calendar */}
          <Card>
            <CardContent className="pt-4 space-y-3">
              <SectionHeader
                icon={Calendar}
                title={L("పంట క్యాలెండర్", "फसल कैलेंडर", "Crop Calendar")}
                color="bg-green-600"
              />
              <SelectField
                label={L("పంట ఎంచుకోండి", "फसल चुनें", "Select Crop")}
                value={calCrop}
                onChange={setCalCrop}
              >
                {crops.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </SelectField>
              <Button
                onClick={loadCalendar}
                disabled={calLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {calLoading ? (
                  <Loader2 className="animate-spin mr-2" size={16} />
                ) : (
                  <Calendar size={16} className="mr-2" />
                )}
                {L("క్యాలెండర్ చూడండి", "कैलेंडर देखें", "Get Calendar")}
              </Button>
              {calResult && (
                <ResultBox
                  result={calResult}
                  color="border-green-200 bg-green-50 dark:bg-green-950/20"
                />
              )}

              {fertResult && (
                <ResultBox
                  result={fertResult}
                  color="border-amber-200 bg-amber-50 dark:bg-amber-950/20"
                  language={language}
                />
              )}
              {pestResult && (
                <ResultBox
                  result={pestResult}
                  color="border-red-200 bg-red-50 dark:bg-red-950/20"
                  language={language}
                />
              )}
              {profitResult && (
                <ResultBox
                  result={profitResult}
                  color="border-purple-200 bg-purple-50 dark:bg-purple-950/20"
                  language={language}
                />
              )}
              {soilResult && (
                <ResultBox
                  result={soilResult}
                  color="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20"
                  language={language}
                />
              )}
              {irrResult && (
                <ResultBox
                  result={irrResult}
                  color="border-blue-200 bg-blue-50 dark:bg-blue-950/20"
                  language={language}
                />
              )}
            </CardContent>
          </Card>

          {/* 2. Fertilizer Calculator */}
          <Card>
            <CardContent className="pt-4 space-y-3">
              <SectionHeader
                icon={Calculator}
                title={L(
                  "ఎరువుల లెక్కింపు",
                  "उर्वरक कैलकुलेटर",
                  "Fertilizer Calculator",
                )}
                color="bg-amber-600"
              />
              <div className="grid grid-cols-2 gap-2">
                <SelectField
                  label={L("పంట", "फसल", "Crop")}
                  value={fertCrop}
                  onChange={setFertCrop}
                >
                  {crops.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </SelectField>
                <div>
                  <label className="text-xs font-medium">
                    {L("ఎకరాలు", "एकड़", "Acres")}
                  </label>
                  <Input
                    type="number"
                    value={fertAcres}
                    onChange={(e) => setFertAcres(e.target.value)}
                    className="mt-1"
                    min="0.5"
                    step="0.5"
                  />
                </div>
              </div>
              <SelectField
                label={L("మట్టి రకం", "मिट्टी का प्रकार", "Soil Type")}
                value={fertSoil}
                onChange={setFertSoil}
              >
                <option value="black">
                  {L("నల్ల మట్టి", "काली मिट्टी", "Black soil")}
                </option>
                <option value="red">
                  {L("ఎర్ర మట్టి", "लाल मिट्टी", "Red soil")}
                </option>
                <option value="sandy">
                  {L("ఇసుక మట్టి", "बलुई मिट्टी", "Sandy soil")}
                </option>
                <option value="loamy">
                  {L("గోరు మట్టి", "दोमट मिट्टी", "Loamy soil")}
                </option>
              </SelectField>
              <Button
                onClick={calcFertilizer}
                disabled={fertLoading}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
              >
                {fertLoading ? (
                  <Loader2 className="animate-spin mr-2" size={16} />
                ) : (
                  <Calculator size={16} className="mr-2" />
                )}
                {L("లెక్కించండి", "कैलकुलेट करें", "Calculate")}
              </Button>
              {fertResult && (
                <ResultBox
                  result={fertResult}
                  color="border-amber-200 bg-amber-50 dark:bg-amber-950/20"
                />
              )}
            </CardContent>
          </Card>

          {/* 3. Pest Guide */}
          <Card>
            <CardContent className="pt-4 space-y-3">
              <SectionHeader
                icon={Bug}
                title={L(
                  "చీడపురుగుల గైడ్",
                  "कीट मार्गदर्शिका",
                  "Pest & Insect Guide",
                )}
                color="bg-red-600"
              />
              <div className="grid grid-cols-2 gap-2">
                <SelectField
                  label={L("పంట", "फसल", "Crop")}
                  value={pestCrop}
                  onChange={setPestCrop}
                >
                  {crops.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </SelectField>
                <div>
                  <label className="text-xs font-medium">
                    {L("పురుగు పేరు", "कीट नाम", "Pest name")}
                  </label>
                  <Input
                    value={pestName}
                    onChange={(e) => setPestName(e.target.value)}
                    placeholder="optional"
                    className="mt-1"
                  />
                </div>
              </div>
              <Button
                onClick={getPestGuide}
                disabled={pestLoading}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                {pestLoading ? (
                  <Loader2 className="animate-spin mr-2" size={16} />
                ) : (
                  <Bug size={16} className="mr-2" />
                )}
                {L("గైడ్ చూడండి", "गाइड देखें", "Get Pest Guide")}
              </Button>
              {pestResult && (
                <ResultBox
                  result={pestResult}
                  color="border-red-200 bg-red-50 dark:bg-red-950/20"
                />
              )}
            </CardContent>
          </Card>

          {/* 4. Profit Calculator */}
          <Card>
            <CardContent className="pt-4 space-y-3">
              <SectionHeader
                icon={TrendingUp}
                title={L(
                  "పంట లాభ లెక్కింపు",
                  "फसल लाभ कैलकुलेटर",
                  "Crop Profit Calculator",
                )}
                color="bg-purple-600"
              />
              <div className="grid grid-cols-2 gap-2">
                <SelectField
                  label={L("పంట", "फसल", "Crop")}
                  value={profitCrop}
                  onChange={setProfitCrop}
                >
                  {crops.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </SelectField>
                <div>
                  <label className="text-xs font-medium">
                    {L("ఎకరాలు", "एकड़", "Acres")}
                  </label>
                  <Input
                    type="number"
                    value={profitAcres}
                    onChange={(e) => setProfitAcres(e.target.value)}
                    className="mt-1"
                    min="0.5"
                    step="0.5"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-medium">
                    {L("విత్తనాలు ₹", "बीज ₹", "Seed ₹")}
                  </label>
                  <Input
                    type="number"
                    value={seedCost}
                    onChange={(e) => setSeedCost(e.target.value)}
                    className="mt-1"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">
                    {L("కూలి ₹", "मजदूरी ₹", "Labour ₹")}
                  </label>
                  <Input
                    type="number"
                    value={labourCost}
                    onChange={(e) => setLabourCost(e.target.value)}
                    className="mt-1"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">
                    {L("ఇతర ₹", "अन्य ₹", "Other ₹")}
                  </label>
                  <Input
                    type="number"
                    value={otherCost}
                    onChange={(e) => setOtherCost(e.target.value)}
                    className="mt-1"
                    placeholder="0"
                  />
                </div>
              </div>
              <Button
                onClick={calcProfit}
                disabled={profitLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                {profitLoading ? (
                  <Loader2 className="animate-spin mr-2" size={16} />
                ) : (
                  <TrendingUp size={16} className="mr-2" />
                )}
                {L("లాభం లెక్కించండి", "लाभ कैलकुलेट करें", "Calculate Profit")}
              </Button>
              {profitResult && (
                <ResultBox
                  result={profitResult}
                  color="border-purple-200 bg-purple-50 dark:bg-purple-950/20"
                />
              )}
            </CardContent>
          </Card>

          {/* 5. Soil Health */}
          <Card>
            <CardContent className="pt-4 space-y-3">
              <SectionHeader
                icon={Leaf}
                title={L(
                  "మట్టి ఆరోగ్య పరీక్ష",
                  "मिट्टी स्वास्थ्य जांच",
                  "Soil Health Checker",
                )}
                color="bg-yellow-600"
              />
              <div className="grid grid-cols-3 gap-2">
                <SelectField
                  label={L("మట్టి రంగు", "मिट्टी रंग", "Soil Color")}
                  value={soilColor}
                  onChange={setSoilColor}
                >
                  <option value="black">{L("నల్లగా", "काली", "Black")}</option>
                  <option value="red">{L("ఎర్రగా", "लाल", "Red")}</option>
                  <option value="brown">{L("గోధుమ", "भूरी", "Brown")}</option>
                  <option value="yellow">{L("పసుపు", "पीली", "Yellow")}</option>
                </SelectField>
                <SelectField
                  label={L("తేమ", "नमी", "Moisture")}
                  value={soilMoisture}
                  onChange={setSoilMoisture}
                >
                  <option value="dry">{L("పొడి", "सूखी", "Dry")}</option>
                  <option value="medium">
                    {L("మధ్యస్థం", "मध्यम", "Medium")}
                  </option>
                  <option value="wet">{L("తడిగా", "गीली", "Wet")}</option>
                </SelectField>
                <SelectField
                  label={L("పంట", "फसल", "Crop")}
                  value={soilCrop}
                  onChange={setSoilCrop}
                >
                  {crops.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </SelectField>
              </div>
              <Button
                onClick={checkSoil}
                disabled={soilLoading}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                {soilLoading ? (
                  <Loader2 className="animate-spin mr-2" size={16} />
                ) : (
                  <Leaf size={16} className="mr-2" />
                )}
                {L("మట్టి పరీక్షించండి", "मिट्टी जांचें", "Check Soil")}
              </Button>
              {soilResult && (
                <ResultBox
                  result={soilResult}
                  color="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20"
                />
              )}
            </CardContent>
          </Card>

          {/* 6. Irrigation */}
          <Card>
            <CardContent className="pt-4 space-y-3">
              <SectionHeader
                icon={Droplets}
                title={L("నీటి పారుదల గైడ్", "सिंचाई गाइड", "Irrigation Guide")}
                color="bg-blue-600"
              />
              <div className="grid grid-cols-3 gap-2">
                <SelectField
                  label={L("పంట", "फसल", "Crop")}
                  value={irrCrop}
                  onChange={setIrrCrop}
                >
                  {crops.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </SelectField>
                <SelectField
                  label={L("పద్ధతి", "विधि", "Method")}
                  value={irrMethod}
                  onChange={setIrrMethod}
                >
                  <option value="flood">{L("వరద", "बाढ़", "Flood")}</option>
                  <option value="drip">{L("డ్రిప్", "ड्रिप", "Drip")}</option>
                  <option value="sprinkler">
                    {L("స్ప్రింక్లర్", "स्प्रिंकलर", "Sprinkler")}
                  </option>
                  <option value="furrow">{L("వాల్", "नाली", "Furrow")}</option>
                </SelectField>
                <div>
                  <label className="text-xs font-medium">
                    {L("ఎకరాలు", "एकड़", "Acres")}
                  </label>
                  <Input
                    type="number"
                    value={irrAcres}
                    onChange={(e) => setIrrAcres(e.target.value)}
                    className="mt-1"
                    min="0.5"
                    step="0.5"
                  />
                </div>
              </div>
              <Button
                onClick={getIrrigation}
                disabled={irrLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {irrLoading ? (
                  <Loader2 className="animate-spin mr-2" size={16} />
                ) : (
                  <Droplets size={16} className="mr-2" />
                )}
                {L("గైడ్ చూడండి", "गाइड देखें", "Get Guide")}
              </Button>
              {irrResult && (
                <ResultBox
                  result={irrResult}
                  color="border-blue-200 bg-blue-50 dark:bg-blue-950/20"
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══════════════ NEWS TAB ═══════════════ */}
      {tab === "news" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {lastUpdated &&
                `${L("నవీకరించబడింది", "अपडेट", "Updated")}: ${lastUpdated}`}
            </p>
            <Button
              onClick={fetchNews}
              disabled={newsLoading}
              size="sm"
              variant="outline"
              className="gap-1"
            >
              <RefreshCw
                size={13}
                className={newsLoading ? "animate-spin" : ""}
              />
              {L("రిఫ్రెష్", "रिफ्रेश", "Refresh")}
            </Button>
          </div>

          {newsLoading && (
            <div className="flex flex-col items-center py-12 gap-3">
              <Loader2 size={32} className="animate-spin text-blue-500" />
              <p className="text-sm text-muted-foreground">
                {L(
                  "వార్తలు తెస్తున్నాం...",
                  "खबरें ला रहे हैं...",
                  "Fetching news...",
                )}
              </p>
            </div>
          )}

          {!newsLoading &&
            newsList.map((item, i) => (
              <Card
                key={i}
                className={`border-l-4 hover:shadow-md transition-shadow ${
                  item.importance === "high"
                    ? "border-l-red-500"
                    : item.importance === "medium"
                      ? "border-l-amber-500"
                      : "border-l-green-500"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl shrink-0">{item.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${categoryColor[item.category] || "bg-gray-100 text-gray-800"}`}
                        >
                          {item.category}
                        </span>
                        {item.state && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                            📍 {item.state}
                          </span>
                        )}
                        {item.importance === "high" && (
                          <span className="text-xs font-bold text-red-600">
                            {L("ముఖ్యం", "महत्वपूर्ण", "Important")}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-sm leading-snug mb-1">
                        {item.title}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {item.summary}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        {item.date && (
                          <p className="text-xs text-muted-foreground">
                            📅 {item.date}
                          </p>
                        )}
                        <VoiceButton
                          text={`${item.title}. ${item.summary}`}
                          language={language}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          {!newsLoading && newsList.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <Newspaper
                  size={40}
                  className="mx-auto text-muted-foreground mb-3"
                />
                <p className="text-muted-foreground text-sm">
                  {L(
                    "వార్తలు లోడ్ కాలేదు",
                    "खबरें लोड नहीं हुईं",
                    "Could not load news",
                  )}
                </p>
                <Button onClick={fetchNews} className="mt-3" variant="outline">
                  {L("మళ్ళీ ప్రయత్నించండి", "फिर प्रयास करें", "Try again")}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
