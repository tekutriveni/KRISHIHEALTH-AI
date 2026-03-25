import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Leaf,
  HeartPulse,
  TrendingUp,
  MessageSquare,
  Bell,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  Cloud,
  Sprout,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/language";
import type { Language } from "@/lib/language";
import type { DiseaseDetection, HealthCheckin } from "@shared/schema";
import { WeatherMiniCard } from "@/pages/weather";

interface HomeProps {
  language: Language;
}

function StatusIcon({ status }: { status: string }) {
  if (status === "green")
    return <CheckCircle2 className="text-green-500" size={18} />;
  if (status === "yellow")
    return <AlertTriangle className="text-yellow-500" size={18} />;
  return <XCircle className="text-red-500" size={18} />;
}

function getCurrentSession(): string {
  const now = new Date();
  const h = now.getHours();
  const day = now.getDay();
  if (day === 0 && h >= 18) return "weekly";
  if (h >= 7 && h < 12) return "morning";
  if (h >= 12 && h < 18) return "noon";
  if (h >= 18) return "evening";
  return "morning";
}

// ── YouTube-style Weather Popup Notification ───────────────────────────────────
function WeatherPopupAlert({ language }: { language: Language }) {
  const [alert, setAlert] = useState<{
    icon: string;
    message: string;
    level: "red" | "yellow" | "green";
  } | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const dismissed_key =
      "weather_alert_dismissed_" + new Date().toDateString();
    if (sessionStorage.getItem(dismissed_key)) return;

    const load = (lat: number, lon: number) => {
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=Asia/Kolkata`,
      )
        .then((r) => r.json())
        .then((data) => {
          const c = data.current;
          const temp = Math.round(c.temperature_2m);
          const humidity = c.relative_humidity_2m;
          const wind = Math.round(c.wind_speed_10m);
          const code = c.weather_code;

          let icon = "✅";
          let level: "red" | "yellow" | "green" = "green";
          let message =
            language === "te"
              ? "పొలం పనికి మంచి రోజు! సురక్షితంగా పని చేయండి."
              : language === "hi"
                ? "खेत के काम के लिए अच्छा दिन!"
                : "Good day for farm work!";

          if (temp > 40) {
            icon = "🌡️";
            level = "red";
            message =
              language === "te"
                ? "అతి వేడిగా ఉంది! పొలం పనికి వెళ్ళకండి — Heat stroke ప్రమాదం!"
                : language === "hi"
                  ? "बहुत गर्म है! खेत में मत जाएं — Heat stroke का खतरा!"
                  : "Too hot! Avoid field work — Heat stroke danger!";
          } else if ([61, 63, 65, 80, 95, 96].includes(code)) {
            icon = "🌧️";
            level = "yellow";
            message =
              language === "te"
                ? "వర్షం వస్తోంది — పురుగుమందు spray వద్దు!"
                : language === "hi"
                  ? "बारिश आ रही है — कीटनाशक स्प्रे मत करें!"
                  : "Rain expected — Don't spray pesticides!";
          } else if (humidity > 80) {
            icon = "💧";
            level = "yellow";
            message =
              language === "te"
                ? "తేమ ఎక్కువగా ఉంది — Fungal disease జాగ్రత్త!"
                : language === "hi"
                  ? "नमी बहुत ज्यादा — Fungal रोग से सावधान!"
                  : "High humidity — Watch for fungal disease!";
          } else if (wind > 30) {
            icon = "💨";
            level = "yellow";
            message =
              language === "te"
                ? "గాలి చాలా ఎక్కువ — Spray చేయకండి!"
                : language === "hi"
                  ? "तेज हवा — Spray मत करें!"
                  : "High wind — Don't spray chemicals!";
          }

          setAlert({ icon, message, level });
          setTimeout(() => {
            setVisible(true);
          }, 1500);
          setTimeout(() => {
            setVisible(false);
          }, 9000);
        })
        .catch(() => {});
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => load(p.coords.latitude, p.coords.longitude),
        () => load(17.385, 78.4867),
      );
    } else {
      load(17.385, 78.4867);
    }
  }, [language]);

  function dismiss() {
    setVisible(false);
    setDismissed(true);
    sessionStorage.setItem(
      "weather_alert_dismissed_" + new Date().toDateString(),
      "1",
    );
  }

  if (!alert || !visible || dismissed) return null;

  const bgColor =
    alert.level === "red"
      ? "bg-red-600 text-white"
      : alert.level === "yellow"
        ? "bg-amber-500 text-white"
        : "bg-green-600 text-white";

  return (
    <div
      className={`fixed top-[60px] left-0 right-0 z-[100] px-3 transition-all duration-500 ${visible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}`}
      data-testid="weather-popup-alert"
    >
      <div
        className={`${bgColor} rounded-xl shadow-2xl p-3 flex items-start gap-3 max-w-md mx-auto`}
      >
        <span className="text-2xl shrink-0 mt-0.5">{alert.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
            <Cloud size={10} className="inline mr-1" />
            {language === "te"
              ? "వాతావరణ హెచ్చరిక"
              : language === "hi"
                ? "मौसम चेतावनी"
                : "Weather Alert"}
          </p>
          <p className="text-sm font-medium leading-snug mt-0.5">
            {alert.message}
          </p>
        </div>
        <button
          onClick={dismiss}
          className="shrink-0 opacity-80 hover:opacity-100 p-1"
          data-testid="button-dismiss-alert"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

export default function Home({ language }: HomeProps) {
  const tx = useTranslation(language);

  const { data: detections } = useQuery<DiseaseDetection[]>({
    queryKey: ["/api/disease-detections"],
  });

  const { data: checkins } = useQuery<HealthCheckin[]>({
    queryKey: ["/api/health-checkins"],
  });

  const session = getCurrentSession();
  const sessionLabels: Record<string, string> = {
    morning: tx.morningSession,
    noon: tx.noonSession,
    evening: tx.eveningSession,
    weekly: "Weekly Check (Sunday) 📅",
  };

  const quickActions = [
    {
      path: "/disease",
      icon: Leaf,
      label: tx.detectDisease,
      color: "bg-green-500",
      emoji: "🌿",
    },
    {
      path: "/health",
      icon: HeartPulse,
      label: tx.healthCheckin,
      color: "bg-blue-500",
      emoji: "💊",
    },
    {
      path: "/mandi",
      icon: TrendingUp,
      label: tx.mandiPrices,
      color: "bg-orange-500",
      emoji: "📊",
    },
    {
      path: "/chat",
      icon: MessageSquare,
      label: tx.aiChat,
      color: "bg-purple-500",
      emoji: "🤖",
    },
    {
      path: "/weather",
      icon: Cloud,
      label:
        language === "te" ? "వాతావరణం" : language === "hi" ? "मौसम" : "Weather",
      color: "bg-sky-500",
      emoji: "🌤️",
    },
    {
      path: "/farm",
      icon: Sprout,
      label:
        language === "te"
          ? "వ్యవసాయ గైడ్"
          : language === "hi"
            ? "कृषि गाइड"
            : "Farm Guide",
      color: "bg-green-600",
      emoji: "🌱",
    },
  ];

  const lastCheckin = checkins?.[0];
  const lastDetection = detections?.[0];

  return (
    <div className="space-y-5">
      {/* YouTube-style weather popup */}
      <WeatherPopupAlert language={language} />

      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/90 to-primary rounded-xl p-5 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">🌾</span>
          <div>
            <h2 className="text-xl font-bold">{tx.appName}</h2>
            <p className="text-sm opacity-90">{tx.tagline}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3 bg-white/20 rounded-lg px-3 py-2">
          <Clock size={16} />
          <span className="text-sm font-medium">{sessionLabels[session]}</span>
        </div>
      </div>

      {/* Quick Actions — 2+3 grid */}
      <div className="grid grid-cols-3 gap-3">
        {quickActions.map(({ path, emoji, label }) => (
          <Link key={path} href={path}>
            <Card className="cursor-pointer hover:shadow-md transition-shadow active:scale-95">
              <CardContent className="p-3 flex flex-col items-center gap-1">
                <span className="text-2xl">{emoji}</span>
                <span className="text-xs font-semibold text-center leading-tight">
                  {label}
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Weather mini card */}
      <WeatherMiniCard language={language} />

      {/* Last Health Status */}
      {lastCheckin && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <HeartPulse size={16} />
              {tx.recentCheckins}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`rounded-lg p-3 status-${lastCheckin.status}`}>
              <div className="flex items-center gap-2 mb-1">
                <StatusIcon status={lastCheckin.status} />
                <span className="font-semibold text-sm">
                  {lastCheckin.status === "green"
                    ? tx.statusGreen
                    : lastCheckin.status === "yellow"
                      ? tx.statusYellow
                      : tx.statusRed}
                </span>
              </div>
              <p className="text-xs opacity-80 line-clamp-2">
                {lastCheckin.aiAdvice}
              </p>
            </div>
            <Link href="/health">
              <Button
                variant="outline"
                className="w-full mt-2 farmer-btn"
                data-testid="button-health-checkin"
              >
                {sessionLabels[session]}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Last Disease Detection */}
      {lastDetection && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Leaf size={16} />
              {tx.recentDetections}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">
                  {lastDetection.diseaseName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(lastDetection.createdAt).toLocaleDateString(
                    "en-IN",
                  )}
                </p>
              </div>
              <Badge
                variant="outline"
                className={`capitalize ${
                  lastDetection.severity === "severe"
                    ? "border-red-400 text-red-600"
                    : lastDetection.severity === "moderate"
                      ? "border-yellow-400 text-yellow-600"
                      : "border-green-400 text-green-600"
                }`}
              >
                {lastDetection.severity}
              </Badge>
            </div>
            <Link href="/disease">
              <Button
                variant="outline"
                className="w-full mt-2 farmer-btn"
                data-testid="button-detect-disease"
              >
                {tx.detectDisease}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Start prompts if no data */}
      {!lastCheckin && !lastDetection && (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center space-y-3">
            <p className="text-muted-foreground text-sm">{tx.noData}</p>
            <Link href="/health">
              <Button
                className="farmer-btn w-full"
                data-testid="button-start-health"
              >
                <HeartPulse size={18} className="mr-2" />
                {sessionLabels[session]}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Alert Banner */}
      <Link href="/alerts">
        <Card className="cursor-pointer border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800 hover:shadow-md transition-shadow">
          <CardContent className="p-3 flex items-center gap-3">
            <Bell className="text-orange-500" size={20} />
            <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
              {tx.smsAlerts}
            </span>
            <span className="ml-auto text-orange-500">→</span>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
