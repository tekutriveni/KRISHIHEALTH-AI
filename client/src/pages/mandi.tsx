import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TrendingUp, RefreshCw, Mic, MicOff, Search } from "lucide-react";
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

export default function Mandi({ language }: MandiProps) {
  const tx = useTranslation(language);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isListening, startListening, stopListening } = useVoice(language);

  const [search, setSearch] = useState("");

  const { data: prices, isLoading } = useQuery<MandiPrice[]>({
    queryKey: ["/api/mandi-prices"],
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/mandi-prices/refresh", { language });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/mandi-prices"], data);
      toast({ title: language === "te" ? "ధరలు నవీకరించబడ్డాయి" : language === "hi" ? "भाव अपडेट हुए" : "Prices updated!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to refresh prices", variant: "destructive" });
    },
  });

  function getCropDisplayName(price: MandiPrice): string {
    if (language === "te" && price.cropNameTe) return price.cropNameTe;
    if (language === "hi" && price.cropNameHi) return price.cropNameHi;
    return price.cropName;
  }

  const filtered = prices?.filter((p) => {
    const name = getCropDisplayName(p).toLowerCase();
    const eng = p.cropName.toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || eng.includes(q);
  });

  const cropEmojis: Record<string, string> = {
    Rice: "🌾", Wheat: "🌾", Cotton: "🌿", Maize: "🌽",
    Soybean: "🫘", Groundnut: "🥜", Turmeric: "🟡",
    Chilli: "🌶️", Tomato: "🍅", Onion: "🧅",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <TrendingUp className="text-primary" size={22} />
          <h2 className="text-xl font-bold">{tx.mandiPrices}</h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refreshMutation.mutate()}
          disabled={refreshMutation.isPending}
          data-testid="button-refresh-prices"
        >
          <RefreshCw size={14} className={`mr-1 ${refreshMutation.isPending ? "animate-spin" : ""}`} />
          {refreshMutation.isPending ? tx.refreshing : tx.refreshPrices}
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={language === "te" ? "పంట వెతకండి..." : language === "hi" ? "फसल खोजें..." : "Search crop..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search-crop"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          className={`h-10 w-10 ${isListening ? "border-red-400 bg-red-50 dark:bg-red-950/30 recording-pulse" : ""}`}
          onClick={() => {
            if (isListening) stopListening();
            else startListening((text) => setSearch(text));
          }}
          data-testid="button-voice-search"
        >
          {isListening ? <MicOff size={16} className="text-red-500" /> : <Mic size={16} />}
        </Button>
      </div>

      {/* Prices Table */}
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
          {filtered?.map((price) => (
            <Card key={price.id} className="hover:shadow-sm transition-shadow" data-testid={`card-crop-${price.id}`}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{cropEmojis[price.cropName] || "🌱"}</span>
                    <div>
                      <p className="font-bold text-sm">{getCropDisplayName(price)}</p>
                      {language !== "en" && (
                        <p className="text-xs text-muted-foreground">{price.cropName}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">₹{price.modalPrice}</p>
                    <p className="text-xs text-muted-foreground">/quintal</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex gap-3">
                    <span>
                      <span className="text-green-600">↓</span> ₹{price.minPrice}
                    </span>
                    <span>
                      <span className="text-red-500">↑</span> ₹{price.maxPrice}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs px-1.5 py-0">{price.market}</Badge>
                    <span className="opacity-70">{price.state === "Telangana" ? "TG" : "AP"}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1 opacity-60">{tx.date}: {price.date}</p>
              </CardContent>
            </Card>
          ))}
          {filtered?.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground text-sm">
                {tx.noData}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Info footer */}
      <div className="text-xs text-muted-foreground text-center py-2">
        {language === "te"
          ? "ధరలు తెలంగాణ & ఆంధ్రప్రదేశ్ మండీల నుండి"
          : language === "hi"
          ? "भाव तेलंगाना और आंध्र प्रदेश मंडियों से"
          : "Prices from Telangana & Andhra Pradesh mandis"}
      </div>
    </div>
  );
}
