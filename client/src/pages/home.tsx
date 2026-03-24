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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/language";
import type { Language } from "@/lib/language";
import type { DiseaseDetection, HealthCheckin } from "@shared/schema";
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
  ];

  const lastCheckin = checkins?.[0];
  const lastDetection = detections?.[0];

  return (
    <div className="space-y-5">
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

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        {quickActions.map(({ path, emoji, label }) => (
          <Link key={path} href={path}>
            <Card className="cursor-pointer hover:shadow-md transition-shadow active:scale-95">
              <CardContent className="p-4 flex flex-col items-center gap-2">
                <span className="text-3xl">{emoji}</span>
                <span className="text-sm font-semibold text-center leading-tight">
                  {label}
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

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
