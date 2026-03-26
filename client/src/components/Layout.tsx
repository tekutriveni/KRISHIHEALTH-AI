import { Link, useLocation } from "wouter";
import {
  Home,
  Leaf,
  HeartPulse,
  TrendingUp,
  MessageSquare,
  Bell,
  Cloud,
  Sprout,
  ShoppingBag,
  Tractor,
  Factory,
} from "lucide-react";
import { LANGUAGES, useTranslation } from "@/lib/language";
import type { Language } from "@/lib/language";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LayoutProps {
  children: React.ReactNode;
  language: Language;
  setLanguage: (lang: Language) => void;
}

export function Layout({ children, language, setLanguage }: LayoutProps) {
  const [location] = useLocation();
  const tx = useTranslation(language);

  const navItems = [
    { path: "/", icon: Home, label: tx.home },
    { path: "/disease", icon: Leaf, label: tx.disease },
    { path: "/health", icon: HeartPulse, label: tx.health },
    { path: "/mandi", icon: TrendingUp, label: tx.mandi },
    { path: "/chat", icon: MessageSquare, label: tx.chat },
    { path: "/alerts", icon: Bell, label: tx.alerts },
    {
      path: "/weather",
      icon: Cloud,
      label:
        language === "te" ? "వాతావరణం" : language === "hi" ? "मौसम" : "Weather",
    },
    {
      path: "/farm",
      icon: Sprout,
      label:
        language === "te" ? "వ్యవసాయం" : language === "hi" ? "कृषि" : "Farm",
    },
    {
      path: "/market",
      icon: ShoppingBag,
      label:
        language === "te" ? "మార్కెట్" : language === "hi" ? "बाजार" : "Market",
    },
    {
      path: "/equipment",
      icon: Tractor,
      label:
        language === "te"
          ? "పరికరాలు"
          : language === "hi"
            ? "उपकरण"
            : "Equipment",
    },
    {
      path: "/millbook",
      icon: Factory,
      label:
        language === "te"
          ? "మిల్ బుకింగ్"
          : language === "hi"
            ? "मिल बुकिंग"
            : "Mill Book",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Header */}
      <header className="bg-sidebar text-sidebar-foreground px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌾</span>
          <div>
            <h1 className="text-lg font-bold leading-tight">{tx.appName}</h1>
            <p className="text-xs opacity-70 leading-tight hidden sm:block">
              {tx.tagline}
            </p>
          </div>
        </div>
        <Select
          value={language}
          onValueChange={(v) => setLanguage(v as Language)}
        >
          <SelectTrigger
            className="w-32 bg-sidebar-accent border-sidebar-border text-sidebar-foreground text-sm h-9"
            data-testid="select-language"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((l) => (
              <SelectItem
                key={l.code}
                value={l.code}
                data-testid={`lang-option-${l.code}`}
              >
                {l.flag} {l.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-28 px-4 py-4 max-w-2xl mx-auto w-full">
        {children}
      </main>

      {/* Bottom Navigation — scrollable */}
      <nav className="fixed bottom-0 left-0 right-0 bg-sidebar border-t border-sidebar-border z-50">
        <div
          className="flex items-stretch max-w-2xl mx-auto overflow-x-auto"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive =
              location === path || (path !== "/" && location.startsWith(path));
            return (
              <Link
                key={path}
                href={path}
                className={`flex-shrink-0 min-w-[60px] flex flex-col items-center justify-center py-2 px-1 gap-0.5 transition-colors ${
                  isActive
                    ? "text-sidebar-primary bg-sidebar-accent"
                    : "text-sidebar-foreground opacity-70 hover:opacity-100 hover:bg-sidebar-accent"
                }`}
                data-testid={`nav-${path.replace("/", "") || "home"}`}
              >
                <Icon size={20} />
                <span className="text-[9px] leading-tight text-center font-medium">
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
