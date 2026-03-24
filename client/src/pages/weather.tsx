import { useState, useEffect } from "react";
import {
  Cloud,
  Wind,
  Droplets,
  Thermometer,
  MapPin,
  RefreshCw,
  Search,
  X,
  Gauge,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Language } from "@/lib/language";

interface WeatherProps {
  language: Language;
}

function getWeatherInfo(code: number, lang: string) {
  const map: Record<
    number,
    { emoji: string; en: string; te: string; hi: string }
  > = {
    0: { emoji: "☀️", en: "Clear Sky", te: "స్వచ్ఛమైన ఆకాశం", hi: "साफ आसमान" },
    1: {
      emoji: "🌤️",
      en: "Mainly Clear",
      te: "ఎక్కువగా స్వచ్ఛంగా",
      hi: "ज्यादातर साफ",
    },
    2: {
      emoji: "⛅",
      en: "Partly Cloudy",
      te: "పాక్షికంగా మేఘావృతం",
      hi: "आंशिक बादल",
    },
    3: { emoji: "☁️", en: "Overcast", te: "మేఘావృతం", hi: "बादल छाए" },
    45: { emoji: "🌫️", en: "Foggy", te: "మంచు పొర", hi: "कोहरा" },
    51: {
      emoji: "🌦️",
      en: "Light Drizzle",
      te: "తేలికపాటి జల్లు",
      hi: "हल्की बूंदाबांदी",
    },
    61: {
      emoji: "🌧️",
      en: "Slight Rain",
      te: "తేలికపాటి వర్షం",
      hi: "हल्की बारिश",
    },
    63: {
      emoji: "🌧️",
      en: "Moderate Rain",
      te: "మధ్యస్థ వర్షం",
      hi: "मध्यम बारिश",
    },
    65: { emoji: "🌧️", en: "Heavy Rain", te: "భారీ వర్షం", hi: "भारी बारिश" },
    80: {
      emoji: "🌦️",
      en: "Rain Showers",
      te: "వర్షపు జల్లులు",
      hi: "बारिश की फुहार",
    },
    95: { emoji: "⛈️", en: "Thunderstorm", te: "ఉరుముతో వర్షం", hi: "तूफान" },
    96: {
      emoji: "⛈️",
      en: "Heavy Thunderstorm",
      te: "భారీ ఉరుముతో వర్షం",
      hi: "भारी तूफान",
    },
  };
  const info = map[code] || {
    emoji: "🌡️",
    en: "Unknown",
    te: "తెలియదు",
    hi: "अज्ञात",
  };
  return {
    emoji: info.emoji,
    description: lang === "te" ? info.te : lang === "hi" ? info.hi : info.en,
  };
}

function getFarmerAdvisory(
  temp: number,
  humidity: number,
  windSpeed: number,
  weatherCode: number,
  lang: string,
) {
  const advisories: {
    level: "red" | "yellow" | "green";
    message: string;
    icon: string;
  }[] = [];
  if (temp > 40)
    advisories.push({
      level: "red",
      icon: "🌡️",
      message:
        lang === "te"
          ? "అతి వేడిగా ఉంది! పొలం పనికి వెళ్ళకండి — Heat stroke ప్రమాదం!"
          : lang === "hi"
            ? "बहुत गर्म है! खेत में मत जाएं — Heat stroke का खतरा!"
            : "Too hot! Don't go to field — Heat stroke danger!",
    });
  else if (temp > 35)
    advisories.push({
      level: "yellow",
      icon: "☀️",
      message:
        lang === "te"
          ? "వేడిగా ఉంది — తెల్లవారు 6-9 AM లేదా సాయంత్రం 5-7 PM లో పని చేయండి."
          : lang === "hi"
            ? "गर्म है — सुबह 6-9 या शाम 5-7 में काम करें।"
            : "Hot — Work in morning 6-9 AM or evening 5-7 PM.",
    });
  if ([61, 63, 65, 80, 95, 96].includes(weatherCode))
    advisories.push({
      level: "yellow",
      icon: "🌧️",
      message:
        lang === "te"
          ? "వర్షం వస్తోంది — పురుగుమందు spray వద్దు! పంట కోత వాయిదా వేయండి."
          : lang === "hi"
            ? "बारिश आ रही है — कीटनाशक स्प्रे मत करें!"
            : "Rain coming — Don't spray pesticides! Postpone harvesting.",
    });
  if (humidity > 80)
    advisories.push({
      level: "yellow",
      icon: "💧",
      message:
        lang === "te"
          ? "తేమ చాలా ఎక్కువగా ఉంది — Fungal disease జాగ్రత్త!"
          : lang === "hi"
            ? "नमी बहुत ज्यादा है — Fungal रोग से सावधान!"
            : "Very high humidity — Beware of fungal disease!",
    });
  if (windSpeed > 30)
    advisories.push({
      level: "yellow",
      icon: "💨",
      message:
        lang === "te"
          ? "గాలి చాలా ఎక్కువగా ఉంది — Spray చేయకండి!"
          : lang === "hi"
            ? "बहुत तेज हवा — Spray मत करें!"
            : "Very high wind — Don't spray!",
    });
  if (advisories.length === 0)
    advisories.push({
      level: "green",
      icon: "✅",
      message:
        lang === "te"
          ? "పొలం పనికి మంచి రోజు! సురక్షితంగా పని చేయండి."
          : lang === "hi"
            ? "खेत के काम के लिए अच्छा दिन!"
            : "Good day for farm work! Work safely.",
    });
  return advisories;
}

// ── DAILY TIPS based on today's weather ──────────────────────────────────────
function getDailyTips(
  temp: number,
  humidity: number,
  windSpeed: number,
  weatherCode: number,
  rain: number,
  lang: string,
) {
  const tips: string[] = [];
  const isRainy = [61, 63, 65, 80, 95, 96].includes(weatherCode) || rain > 3;
  const isHot = temp > 35;
  const isWindy = windSpeed > 25;
  const isHumid = humidity > 75;

  if (isRainy) {
    tips.push(
      lang === "te"
        ? "🌧️ వర్షం రోజు — పొలంలో drainage సరిగా ఉందో చూడండి"
        : lang === "hi"
          ? "🌧️ बारिश — drainage जांचें"
          : "🌧️ Rainy day — check field drainage",
    );
    tips.push(
      lang === "te"
        ? "🚫 ఈ రోజు పురుగుమందు spray చేయకండి"
        : lang === "hi"
          ? "🚫 आज कीटनाशक spray न करें"
          : "🚫 No pesticide spray today",
    );
    tips.push(
      lang === "te"
        ? "🌱 వర్షం నీరు పొలంలో నిలవకుండా చూడండి"
        : lang === "hi"
          ? "🌱 खेत में पानी जमा न होने दें"
          : "🌱 Prevent waterlogging in field",
    );
  } else if (isHot) {
    tips.push(
      lang === "te"
        ? "🌅 తెల్లవారు 6-10 AM లో పని చేయండి — వేడిని తప్పించుకోండి"
        : lang === "hi"
          ? "🌅 सुबह 6-10 AM में काम करें"
          : "🌅 Work early morning 6-10 AM",
    );
    tips.push(
      lang === "te"
        ? "💧 పొలంలో పని చేసేటప్పుడు నీళ్ళు తాగండి — 30 నిమిషాలకు ఒకసారి"
        : lang === "hi"
          ? "💧 हर 30 मिनट पानी पिएं"
          : "💧 Drink water every 30 mins in field",
    );
    tips.push(
      lang === "te"
        ? "🌿 మొక్కలకు సాయంత్రం నీళ్ళు పెట్టండి — ఆవిరి తక్కువగా అవుతుంది"
        : lang === "hi"
          ? "🌿 शाम को पौधों को पानी दें"
          : "🌿 Water plants in evening to reduce evaporation",
    );
  } else {
    tips.push(
      lang === "te"
        ? "✅ పొలం పనికి మంచి రోజు — spray చేయవచ్చు"
        : lang === "hi"
          ? "✅ आज खेत के काम के लिए अच्छा दिन"
          : "✅ Good day for all farm activities",
    );
    tips.push(
      lang === "te"
        ? "🌾 పంట పరిశీలన చేయండి — వ్యాధులు ముందే గుర్తించండి"
        : lang === "hi"
          ? "🌾 फसल की जांच करें"
          : "🌾 Inspect crops for early disease detection",
    );
  }

  if (isWindy)
    tips.push(
      lang === "te"
        ? "💨 గాలి ఎక్కువగా ఉంది — spray చేయకండి, దవడు పక్కకు పోతుంది"
        : lang === "hi"
          ? "💨 तेज हवा — spray न करें"
          : "💨 Windy — avoid spraying, chemicals will drift",
    );
  if (isHumid && !isRainy)
    tips.push(
      lang === "te"
        ? "🍄 తేమ ఎక్కువగా ఉంది — Fungal వ్యాధులు రావచ్చు, పంట చూడండి"
        : lang === "hi"
          ? "🍄 नमी ज्यादा — Fungal रोग की जांच करें"
          : "🍄 High humidity — watch for fungal diseases",
    );

  // Always add a health tip
  tips.push(
    lang === "te"
      ? "🩺 పొలం పని తర్వాత చేతులు సబ్బుతో కడుగుకోండి"
      : lang === "hi"
        ? "🩺 खेत के बाद हाथ साबुन से धोएं"
        : "🩺 Wash hands with soap after farm work",
  );

  return tips;
}

function getDayName(dateStr: string, lang: string) {
  const days = {
    en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    te: ["ఆది", "సోమ", "మంగళ", "బుధ", "గురు", "శుక్ర", "శని"],
    hi: ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"],
  };
  const list = days[lang as keyof typeof days] || days.en;
  return list[new Date(dateStr).getDay()];
}

// ── Search location by name ───────────────────────────────────────────────────
async function searchLocation(
  query: string,
): Promise<{ lat: number; lon: number; name: string } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=in`,
    );
    const data = await res.json();
    if (!data.length) return null;
    return {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
      name: data[0].display_name.split(",").slice(0, 2).join(", "),
    };
  } catch {
    return null;
  }
}

// ── WeatherMiniCard — export for Home page ────────────────────────────────────
export function WeatherMiniCard({ language }: { language: Language }) {
  const [w, setW] = useState<any>(null);
  const [loc, setLoc] = useState("");

  useEffect(() => {
    const load = (lat: number, lon: number) => {
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=Asia/Kolkata`,
      )
        .then((r) => r.json())
        .then(setW)
        .catch(() => {});
      fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      )
        .then((r) => r.json())
        .then((d) =>
          setLoc(
            d.address?.city || d.address?.town || d.address?.village || "",
          ),
        )
        .catch(() => {});
    };
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        (p) => load(p.coords.latitude, p.coords.longitude),
        () => load(17.385, 78.4867),
      );
    else load(17.385, 78.4867);
  }, []);

  if (!w)
    return (
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <CardContent className="p-3 flex items-center gap-2">
          <span className="text-2xl animate-pulse">🌤️</span>
          <span className="text-xs text-muted-foreground">
            {language === "te"
              ? "వాతావరణం లోడ్ అవుతోంది..."
              : language === "hi"
                ? "मौसम लोड हो रहा है..."
                : "Loading weather..."}
          </span>
        </CardContent>
      </Card>
    );

  const { emoji, description } = getWeatherInfo(
    w.current.weather_code,
    language,
  );
  const temp = Math.round(w.current.temperature_2m);
  const humidity = w.current.relative_humidity_2m;
  const wind = Math.round(w.current.wind_speed_10m);
  const advisory = getFarmerAdvisory(
    temp,
    humidity,
    wind,
    w.current.weather_code,
    language,
  )[0];

  return (
    <Card
      className={`border-2 ${advisory.level === "red" ? "border-red-400 bg-red-50" : advisory.level === "yellow" ? "border-yellow-400 bg-yellow-50" : "border-green-400 bg-green-50"} dark:bg-transparent`}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin size={10} />
            <span>{loc || "..."}</span>
          </div>
          <a href="/weather" className="text-xs text-primary underline">
            {language === "te"
              ? "పూర్తి వివరాలు"
              : language === "hi"
                ? "पूरा देखें"
                : "Full details"}
          </a>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-4xl">{emoji}</span>
          <div className="flex-1">
            <div className="text-2xl font-bold">{temp}°C</div>
            <div className="text-xs text-muted-foreground">{description}</div>
          </div>
          <div className="text-right text-xs space-y-1">
            <div>💧 {humidity}%</div>
            <div>💨 {wind}km/h</div>
          </div>
        </div>
        <div
          className={`mt-2 text-xs rounded-lg p-2 ${advisory.level === "red" ? "bg-red-100 text-red-700" : advisory.level === "yellow" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}
        >
          {advisory.icon} {advisory.message}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Weather Page ─────────────────────────────────────────────────────────
export default function Weather({ language }: WeatherProps) {
  const [weather, setWeather] = useState<any>(null);
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);

  async function fetchWeather(lat: number, lon: number) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,weather_code,apparent_temperature,surface_pressure&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code,wind_speed_10m_max&timezone=Asia/Kolkata&forecast_days=7`,
      );
      const data = await res.json();
      setWeather(data);
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      );
      const geoData = await geoRes.json();
      const city =
        geoData.address?.city ||
        geoData.address?.town ||
        geoData.address?.village ||
        geoData.address?.county ||
        "Your Location";
      setLocation(
        `${city}${geoData.address?.state ? ", " + geoData.address.state : ""}`,
      );
    } catch {
      setError(
        language === "te"
          ? "వాతావరణ సమాచారం తీసుకోలేకపోయాం"
          : language === "hi"
            ? "मौसम डेटा नहीं मिला"
            : "Could not fetch weather data",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    const result = await searchLocation(searchQuery);
    setSearchLoading(false);
    if (result) {
      setLocation(result.name);
      fetchWeather(result.lat, result.lon);
    } else
      alert(
        language === "te"
          ? "స్థలం కనుగొనలేదు"
          : language === "hi"
            ? "जगह नहीं मिली"
            : "Location not found",
      );
  }

  function getUserLocation() {
    setLoading(true);
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        (p) => fetchWeather(p.coords.latitude, p.coords.longitude),
        () => fetchWeather(17.385, 78.4867),
      );
    else fetchWeather(17.385, 78.4867);
  }

  useEffect(() => {
    getUserLocation();
  }, []);

  if (loading)
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Cloud className="text-primary" size={22} />
          <h2 className="text-xl font-bold">
            {language === "te"
              ? "వాతావరణం"
              : language === "hi"
                ? "मौसम"
                : "Weather"}
          </h2>
        </div>
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <div className="text-4xl animate-bounce">🌤️</div>
            <p className="text-sm text-muted-foreground animate-pulse">
              {language === "te"
                ? "వాతావరణ సమాచారం తీసుకుంటోంది..."
                : language === "hi"
                  ? "मौसम डेटा लोड हो रहा है..."
                  : "Loading weather data..."}
            </p>
          </CardContent>
        </Card>
      </div>
    );

  if (error || !weather)
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Cloud className="text-primary" size={22} />
          <h2 className="text-xl font-bold">
            {language === "te"
              ? "వాతావరణం"
              : language === "hi"
                ? "मौसम"
                : "Weather"}
          </h2>
        </div>
        <Card>
          <CardContent className="p-6 text-center space-y-3">
            <p className="text-2xl">⚠️</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button onClick={getUserLocation} className="farmer-btn">
              <RefreshCw size={14} className="mr-2" />
              {language === "te"
                ? "మళ్ళీ ప్రయత్నించండి"
                : language === "hi"
                  ? "फिर कोशिश करें"
                  : "Try Again"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );

  const current = weather.current;
  const daily = weather.daily;
  const temp = Math.round(current.temperature_2m);
  const feelsLike = Math.round(current.apparent_temperature);
  const humidity = current.relative_humidity_2m;
  const windSpeed = Math.round(current.wind_speed_10m);
  const weatherCode = current.weather_code;
  const pressure = Math.round(current.surface_pressure);
  const todayRain = daily.precipitation_sum[0] || 0;
  const { emoji, description } = getWeatherInfo(weatherCode, language);
  const advisories = getFarmerAdvisory(
    temp,
    humidity,
    windSpeed,
    weatherCode,
    language,
  );
  const dailyTips = getDailyTips(
    temp,
    humidity,
    windSpeed,
    weatherCode,
    todayRain,
    language,
  );
  const bgGradient = [61, 63, 65, 80, 95, 96].includes(weatherCode)
    ? "from-slate-600 to-slate-800"
    : temp > 35
      ? "from-orange-400 to-red-500"
      : "from-blue-400 to-blue-600";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cloud className="text-primary" size={22} />
          <h2 className="text-xl font-bold">
            {language === "te"
              ? "వాతావరణం"
              : language === "hi"
                ? "मौसम"
                : "Weather"}
          </h2>
        </div>
        <Button variant="outline" size="sm" onClick={getUserLocation}>
          <RefreshCw size={14} className="mr-1" />
          {language === "te"
            ? "రిఫ్రెష్"
            : language === "hi"
              ? "रिफ्रेश"
              : "Refresh"}
        </Button>
      </div>

      {/* ── SEARCH BAR ── */}
      <div className="flex gap-2">
        <Input
          placeholder={
            language === "te"
              ? "వేరే స్థలం వెతకండి... (ఉదా: Guntur, Mumbai)"
              : language === "hi"
                ? "दूसरी जगह खोजें... (जैसे: Delhi, Pune)"
                : "Search another location... (e.g. Delhi, Guntur)"
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="flex-1"
        />
        <Button
          onClick={handleSearch}
          disabled={searchLoading}
          className="farmer-btn shrink-0"
        >
          {searchLoading ? (
            <RefreshCw size={14} className="animate-spin" />
          ) : (
            <Search size={14} />
          )}
        </Button>
        {searchQuery && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSearchQuery("")}
          >
            <X size={14} />
          </Button>
        )}
      </div>

      {/* Advisories */}
      <div className="space-y-2">
        {advisories
          .filter((a) => !dismissed.includes(a.message))
          .map((advisory, i) => (
            <div
              key={i}
              className={`rounded-xl p-3 flex items-start gap-3 border ${advisory.level === "red" ? "bg-red-50 dark:bg-red-950/30 border-red-300" : advisory.level === "yellow" ? "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-300" : "bg-green-50 dark:bg-green-950/30 border-green-300"}`}
            >
              <span className="text-xl shrink-0">{advisory.icon}</span>
              <div className="flex-1">
                <p
                  className={`text-xs font-semibold mb-0.5 ${advisory.level === "red" ? "text-red-700" : advisory.level === "yellow" ? "text-yellow-700" : "text-green-700"}`}
                >
                  {advisory.level === "red"
                    ? language === "te"
                      ? "⚠️ అత్యవసర హెచ్చరిక"
                      : language === "hi"
                        ? "⚠️ आपातकालीन चेतावनी"
                        : "⚠️ Emergency Warning"
                    : advisory.level === "yellow"
                      ? language === "te"
                        ? "🔔 వ్యవసాయ సలహా"
                        : language === "hi"
                          ? "🔔 कृषि सलाह"
                          : "🔔 Farming Advisory"
                      : language === "te"
                        ? "✅ మంచి రోజు"
                        : language === "hi"
                          ? "✅ अच्छा दिन"
                          : "✅ Good Day"}
                </p>
                <p className="text-xs leading-relaxed">{advisory.message}</p>
              </div>
              <button
                onClick={() =>
                  setDismissed((prev) => [...prev, advisory.message])
                }
                className="text-muted-foreground text-xs shrink-0"
              >
                ✕
              </button>
            </div>
          ))}
      </div>

      {/* Current Weather */}
      <div
        className={`rounded-2xl bg-gradient-to-br ${bgGradient} p-5 text-white shadow-lg`}
      >
        <div className="flex items-center gap-2 mb-3 opacity-80">
          <MapPin size={14} />
          <span className="text-sm">{location || "Loading..."}</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-6xl font-bold">{temp}°C</div>
            <div className="text-sm opacity-80 mt-1">
              {language === "te"
                ? "అనుభవం"
                : language === "hi"
                  ? "महसूस"
                  : "Feels like"}{" "}
              {feelsLike}°C
            </div>
            <div className="text-base mt-2 font-medium">
              {emoji} {description}
            </div>
          </div>
          <div className="text-7xl">{emoji}</div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/20">
          <div className="text-center">
            <Droplets size={16} className="mx-auto mb-1 opacity-80" />
            <div className="text-sm font-bold">{humidity}%</div>
            <div className="text-xs opacity-70">
              {language === "te"
                ? "తేమ"
                : language === "hi"
                  ? "नमी"
                  : "Humidity"}
            </div>
          </div>
          <div className="text-center">
            <Wind size={16} className="mx-auto mb-1 opacity-80" />
            <div className="text-sm font-bold">{windSpeed} km/h</div>
            <div className="text-xs opacity-70">
              {language === "te" ? "గాలి" : language === "hi" ? "हवा" : "Wind"}
            </div>
          </div>
          <div className="text-center">
            <Gauge size={16} className="mx-auto mb-1 opacity-80" />
            <div className="text-sm font-bold">{pressure} hPa</div>
            <div className="text-xs opacity-70">
              {language === "te"
                ? "పీడనం"
                : language === "hi"
                  ? "दबाव"
                  : "Pressure"}
            </div>
          </div>
        </div>
      </div>

      {/* ── TODAY'S DAILY FARMING TIPS ── */}
      <Card className="border-green-300 bg-green-50 dark:bg-green-950/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-green-800 dark:text-green-300">
            {language === "te"
              ? "🌾 ఈ రోజు వ్యవసాయ చిట్కాలు"
              : language === "hi"
                ? "🌾 आज के खेती सुझाव"
                : "🌾 Today's Farming Tips"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {dailyTips.map((tip, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-xs bg-white dark:bg-green-950/30 rounded-lg p-2 border border-green-200"
              >
                <span className="leading-relaxed">{tip}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 7-Day Forecast */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            {language === "te"
              ? "7 రోజుల అంచనా"
              : language === "hi"
                ? "7 दिनों का पूर्वानुमान"
                : "7-Day Forecast"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {daily.time.slice(0, 7).map((date: string, i: number) => {
              const { emoji: dayEmoji } = getWeatherInfo(
                daily.weather_code[i],
                language,
              );
              const maxT = Math.round(daily.temperature_2m_max[i]);
              const minT = Math.round(daily.temperature_2m_min[i]);
              const rain = daily.precipitation_sum[i];
              const isToday = i === 0;
              return (
                <div
                  key={i}
                  className={`flex items-center justify-between p-2 rounded-lg ${isToday ? "bg-primary/10" : ""}`}
                >
                  <div className="w-12">
                    <span
                      className={`text-xs font-medium ${isToday ? "text-primary font-bold" : ""}`}
                    >
                      {isToday
                        ? language === "te"
                          ? "ఈరోజు"
                          : language === "hi"
                            ? "आज"
                            : "Today"
                        : getDayName(date, language)}
                    </span>
                  </div>
                  <span className="text-xl">{dayEmoji}</span>
                  <div className="flex items-center gap-1 text-xs text-blue-500">
                    <Droplets size={10} />
                    <span>{rain.toFixed(1)}mm</span>
                  </div>
                  <div className="text-xs text-right">
                    <span className="font-bold text-red-500">{maxT}°</span>
                    <span className="text-muted-foreground"> / {minT}°</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
