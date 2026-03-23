import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  TrendingUp,
  RefreshCw,
  Mic,
  MicOff,
  Search,
  MapPin,
  ArrowUp,
  ArrowDown,
  IndianRupee,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/language";
import { useVoice } from "@/hooks/useVoice";
import { apiRequest } from "@/lib/queryClient";
import type { Language } from "@/lib/language";
import type { MandiPrice } from "@shared/schema";

interface MandiProps {
  language: Language;
}

const CROP_VISUALS: Record<
  string,
  { emoji: string; color: string; bg: string }
> = {
  Rice: { emoji: "🌾", color: "#854F0B", bg: "#FAEEDA" },
  Wheat: { emoji: "🌾", color: "#3B6D11", bg: "#EAF3DE" },
  Cotton: { emoji: "🌿", color: "#085041", bg: "#E1F5EE" },
  Maize: { emoji: "🌽", color: "#854F0B", bg: "#FAEEDA" },
  Soybean: { emoji: "🫘", color: "#3B6D11", bg: "#EAF3DE" },
  Groundnut: { emoji: "🥜", color: "#854F0B", bg: "#FAEEDA" },
  Turmeric: { emoji: "🟡", color: "#854F0B", bg: "#FAEEDA" },
  Chilli: { emoji: "🌶️", color: "#993C1D", bg: "#FAECE7" },
  Tomato: { emoji: "🍅", color: "#993C1D", bg: "#FAECE7" },
  Onion: { emoji: "🧅", color: "#534AB7", bg: "#EEEDFE" },
  Sugarcane: { emoji: "🎋", color: "#3B6D11", bg: "#EAF3DE" },
  Banana: { emoji: "🍌", color: "#854F0B", bg: "#FAEEDA" },
  Mango: { emoji: "🥭", color: "#854F0B", bg: "#FAEEDA" },
  Potato: { emoji: "🥔", color: "#444441", bg: "#F1EFE8" },
  Mustard: { emoji: "🌻", color: "#854F0B", bg: "#FAEEDA" },
  Sunflower: { emoji: "🌻", color: "#854F0B", bg: "#FAEEDA" },
  default: { emoji: "🌱", color: "#3B6D11", bg: "#EAF3DE" },
};

const POPULAR_CROPS = [
  "Rice",
  "Wheat",
  "Cotton",
  "Maize",
  "Chilli",
  "Tomato",
  "Onion",
  "Turmeric",
  "Groundnut",
  "Soybean",
];

const POPULAR_DISTRICTS = [
  "Warangal",
  "Guntur",
  "Karimnagar",
  "Nizamabad",
  "Kurnool",
  "Vijayawada",
  "Hyderabad",
  "Adilabad",
  "Khammam",
  "Nalgonda",
  "Anantapur",
  "Tirupati",
  "Visakhapatnam",
  "Madanapalle",
  "Nagpur",
  "Pune",
  "Nashik",
  "Aurangabad",
  "Kolhapur",
  "Indore",
  "Bhopal",
  "Ujjain",
  "Jabalpur",
  "Jaipur",
  "Jodhpur",
  "Kota",
  "Bikaner",
  "Ludhiana",
  "Amritsar",
  "Patiala",
  "Jalandhar",
  "Patna",
  "Muzaffarpur",
  "Gaya",
  "Bhagalpur",
  "Lucknow",
  "Kanpur",
  "Agra",
  "Varanasi",
  "Allahabad",
  "Ahmedabad",
  "Rajkot",
  "Surat",
  "Vadodara",
  "Chennai",
  "Coimbatore",
  "Madurai",
  "Salem",
  "Bengaluru",
  "Mysuru",
  "Hubli",
  "Mangaluru",
  "Thiruvananthapuram",
  "Kochi",
  "Kozhikode",
  "Bhubaneswar",
  "Cuttack",
  "Sambalpur",
  "Guwahati",
  "Dibrugarh",
  "Ranchi",
  "Jamshedpur",
  "Raipur",
  "Bilaspur",
];

export default function Mandi({ language }: MandiProps) {
  const tx = useTranslation(language);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isListening, startListening, stopListening } = useVoice(language);

  const [search, setSearch] = useState("");
  const [aiResult, setAiResult] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showAllDistricts, setShowAllDistricts] = useState(false);

  const { data: prices, isLoading } = useQuery<MandiPrice[]>({
    queryKey: ["/api/mandi-prices"],
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/mandi-prices/refresh", {
        language,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/mandi-prices"], data);
      toast({
        title:
          language === "te"
            ? "ధరలు నవీకరించబడ్డాయి"
            : language === "hi"
              ? "भाव अपडेट हुए"
              : "Prices updated!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to refresh prices",
        variant: "destructive",
      });
    },
  });

  async function handleSearch(query?: string) {
    const q = (query || search).trim();
    if (!q) return;
    setIsSearching(true);
    setAiResult(null);
    try {
      const res = await apiRequest("POST", "/api/mandi-search", {
        query: q,
        language,
      });
      const data = await res.json();
      setAiResult(data);
    } catch {
      toast({
        title: "Error",
        description: "Search failed. Try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  }

  function getCropVisual(cropName: string) {
    return CROP_VISUALS[cropName] || CROP_VISUALS.default;
  }

  function getCropDisplayName(price: MandiPrice): string {
    if (language === "te" && price.cropNameTe) return price.cropNameTe;
    if (language === "hi" && price.cropNameHi) return price.cropNameHi;
    return price.cropName;
  }

  const filtered = prices?.filter((p) => {
    if (!search) return true;
    const name = getCropDisplayName(p).toLowerCase();
    const eng = p.cropName.toLowerCase();
    const q = search.toLowerCase();
    return (
      name.includes(q) || eng.includes(q) || p.market.toLowerCase().includes(q)
    );
  });

  const placeholder =
    language === "te"
      ? "పంట లేదా జిల్లా వెతకండి... (ఉదా: వరి వరంగల్, Rice Guntur)"
      : language === "hi"
        ? "फसल या जिला खोजें... (जैसे: गेहूं लुधियाना, Rice Delhi)"
        : "Search crop + district... (e.g: Rice Warangal, Cotton Guntur, Onion Nashik)";

  const visibleDistricts = showAllDistricts
    ? POPULAR_DISTRICTS
    : POPULAR_DISTRICTS.slice(0, 14);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="text-primary" size={22} />
          <h2 className="text-xl font-bold">{tx.mandiPrices}</h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refreshMutation.mutate()}
          disabled={refreshMutation.isPending}
        >
          <RefreshCw
            size={14}
            className={`mr-1 ${refreshMutation.isPending ? "animate-spin" : ""}`}
          />
          {refreshMutation.isPending ? tx.refreshing : tx.refreshPrices}
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            className="pl-9 pr-3"
            placeholder={placeholder}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setAiResult(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          className={`h-10 w-10 shrink-0 ${isListening ? "border-red-400 bg-red-50 dark:bg-red-950/30" : ""}`}
          onClick={() => {
            if (isListening) stopListening();
            else
              startListening((text) => {
                setSearch(text);
                setAiResult(null);
              });
          }}
        >
          {isListening ? (
            <MicOff size={16} className="text-red-500" />
          ) : (
            <Mic size={16} />
          )}
        </Button>
        <Button
          className="shrink-0"
          onClick={() => handleSearch()}
          disabled={isSearching || !search.trim()}
        >
          {isSearching ? (
            <RefreshCw size={14} className="animate-spin" />
          ) : language === "te" ? (
            "వెతకు"
          ) : language === "hi" ? (
            "खोजें"
          ) : (
            "Search"
          )}
        </Button>
      </div>

      {/* Quick Crop Chips */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium">
          {language === "te"
            ? "త్వరిత పంటలు:"
            : language === "hi"
              ? "त्वरित फसलें:"
              : "Quick Crops:"}
        </p>
        <div className="flex flex-wrap gap-2">
          {POPULAR_CROPS.map((crop) => {
            const v = getCropVisual(crop);
            return (
              <button
                key={crop}
                onClick={() => {
                  setSearch(crop);
                  handleSearch(crop);
                }}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full border transition-all hover:scale-105"
                style={{
                  background: v.bg,
                  borderColor: v.color,
                  color: v.color,
                }}
              >
                <span>{v.emoji}</span>
                <span className="font-medium">{crop}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* District Chips */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            <MapPin size={11} />
            {language === "te"
              ? "జిల్లాలు (India అంతటా):"
              : language === "hi"
                ? "जिले (पूरा भारत):"
                : "Districts (All India):"}
          </p>
          <button
            className="text-xs text-primary underline"
            onClick={() => setShowAllDistricts(!showAllDistricts)}
          >
            {showAllDistricts
              ? language === "te"
                ? "తక్కువ చూపించు"
                : language === "hi"
                  ? "कम दिखाएं"
                  : "Show Less"
              : language === "te"
                ? "అన్నీ చూపించు"
                : language === "hi"
                  ? "सभी दिखाएं"
                  : "Show All"}
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {visibleDistricts.map((d) => (
            <button
              key={d}
              onClick={() => {
                setSearch(d);
                handleSearch(d);
              }}
              className="text-xs px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {isSearching && (
        <Card>
          <CardContent className="p-5 text-center space-y-2">
            <div className="text-2xl animate-bounce">🔍</div>
            <p className="text-sm text-muted-foreground animate-pulse">
              {language === "te"
                ? "AI భారతదేశం అంతటా ధరలు వెతుకుతోంది..."
                : language === "hi"
                  ? "AI पूरे भारत में भाव खोज रहा है..."
                  : "AI searching prices across India..."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* AI Search Result */}
      {aiResult && !isSearching && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge className="bg-primary text-white text-xs">
              <Search size={10} className="mr-1" />
              {language === "te"
                ? "AI ఫలితం"
                : language === "hi"
                  ? "AI परिणाम"
                  : "AI Result"}
            </Badge>
            {aiResult.district && (
              <Badge variant="outline" className="text-xs">
                <MapPin size={10} className="mr-1" /> {aiResult.district}
              </Badge>
            )}
            <button
              className="ml-auto text-xs text-muted-foreground underline"
              onClick={() => {
                setAiResult(null);
                setSearch("");
              }}
            >
              {language === "te"
                ? "క్లియర్"
                : language === "hi"
                  ? "हटाएं"
                  : "Clear"}
            </button>
          </div>

          {aiResult.prices && aiResult.prices.length > 0 ? (
            aiResult.prices.map((p: any, i: number) => {
              const v = getCropVisual(p.cropName);
              return (
                <Card key={i} className="overflow-hidden border-0 shadow-sm">
                  <div className="h-1.5" style={{ background: v.color }} />
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                          style={{ background: v.bg }}
                        >
                          {v.emoji}
                        </div>
                        <div>
                          <p className="font-bold text-base">
                            {p.cropNameLocal || p.cropName}
                          </p>
                          {p.cropNameLocal &&
                            p.cropNameLocal !== p.cropName && (
                              <p className="text-xs text-muted-foreground">
                                {p.cropName}
                              </p>
                            )}
                          <div className="flex items-center gap-1 mt-0.5">
                            <MapPin
                              size={10}
                              className="text-muted-foreground"
                            />
                            <p className="text-xs text-muted-foreground">
                              {p.market}, {p.state}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          <IndianRupee size={16} className="text-primary" />
                          <p className="text-2xl font-bold text-primary">
                            {p.modalPrice}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          /quintal
                        </p>
                      </div>
                    </div>

                    {/* Price range bar */}
                    <div className="bg-muted rounded-full h-1.5 mb-2 relative overflow-hidden">
                      <div
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: `linear-gradient(to right, #3B6D11, ${v.color})`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs mb-2">
                      <div className="flex items-center gap-1 text-green-600">
                        <ArrowDown size={12} />
                        <span className="font-medium">₹{p.minPrice}</span>
                        <span className="text-muted-foreground">min</span>
                      </div>
                      <div className="flex items-center gap-1 text-red-500">
                        <ArrowUp size={12} />
                        <span className="font-medium">₹{p.maxPrice}</span>
                        <span className="text-muted-foreground">max</span>
                      </div>
                      <span className="text-muted-foreground">{p.date}</span>
                    </div>

                    {p.advice && (
                      <div
                        className="rounded-lg px-3 py-2 text-xs mt-1"
                        style={{ background: v.bg, color: v.color }}
                      >
                        💡 {p.advice}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="p-5 text-center">
                <p className="text-2xl mb-2">🔍</p>
                <p className="text-sm text-muted-foreground">
                  {aiResult.message ||
                    (language === "te"
                      ? "ఆ జిల్లాకు ధరలు కనుగొనలేదు. వేరే పేరు try చేయండి."
                      : language === "hi"
                        ? "उस जिले के भाव नहीं मिले। दूसरा नाम आज़माएं।"
                        : "No prices found. Try a different district or crop name.")}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Default Prices */}
      {!aiResult && !isSearching && (
        <>
          <p className="text-xs text-muted-foreground font-medium">
            {language === "te"
              ? "తెలంగాణ & AP డిఫాల్ట్ ధరలు:"
              : language === "hi"
                ? "तेलंगाना & AP डिफ़ॉल्ट भाव:"
                : "Telangana & AP Default Prices:"}
          </p>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Card key={i}>
                  <CardContent className="p-3 animate-pulse">
                    <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                    <div className="h-3 bg-muted rounded w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered?.map((price) => {
                const v = getCropVisual(price.cropName);
                return (
                  <Card
                    key={price.id}
                    className="overflow-hidden border-0 shadow-sm"
                  >
                    <div className="h-1" style={{ background: v.color }} />
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                            style={{ background: v.bg }}
                          >
                            {v.emoji}
                          </div>
                          <div>
                            <p className="font-bold text-sm">
                              {getCropDisplayName(price)}
                            </p>
                            <div className="flex items-center gap-1">
                              <MapPin
                                size={9}
                                className="text-muted-foreground"
                              />
                              <p className="text-xs text-muted-foreground">
                                {price.market}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">
                            ₹{price.modalPrice}
                          </p>
                          <p className="text-xs text-muted-foreground">/qtl</p>
                        </div>
                      </div>
                      <div className="flex gap-3 text-xs text-muted-foreground mt-2">
                        <span className="text-green-600">
                          ↓ ₹{price.minPrice}
                        </span>
                        <span className="text-red-500">
                          ↑ ₹{price.maxPrice}
                        </span>
                        <Badge
                          variant="outline"
                          className="ml-auto text-xs px-1.5 py-0"
                        >
                          {price.state === "Telangana" ? "TG" : "AP"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {filtered?.length === 0 && (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground text-sm">
                    {tx.noData}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
