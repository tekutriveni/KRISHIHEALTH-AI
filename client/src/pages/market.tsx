import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShoppingBag,
  Plus,
  Phone,
  MapPin,
  Trash2,
  Loader2,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { Language } from "@/lib/language";

interface MarketListing {
  id: number;
  farmerName: string;
  farmerPhone: string;
  cropName: string;
  quantity: string;
  unit: string;
  pricePerUnit: string;
  location: string;
  description: string;
  createdAt: string;
}

interface MarketProps {
  language: Language;
}

const CROPS = {
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
    "అరటి",
    "మామిడి",
    "కూరగాయలు",
    "పండ్లు",
    "ఇతర",
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
    "केला",
    "आम",
    "सब्जियां",
    "फल",
    "अन्य",
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
    "Banana",
    "Mango",
    "Vegetables",
    "Fruits",
    "Other",
  ],
};

export default function Market({ language }: MarketProps) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    farmerName: "",
    farmerPhone: "",
    cropName: "",
    quantity: "",
    unit: "kg",
    pricePerUnit: "",
    location: "",
    description: "",
  });

  const L = (te: string, hi: string, en: string) =>
    language === "te" ? te : language === "hi" ? hi : en;

  const crops = CROPS[language as keyof typeof CROPS] || CROPS.en;

  const { data: listings = [], isLoading } = useQuery<MarketListing[]>({
    queryKey: ["/api/market/listings"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await fetch("/api/market/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/market/listings"] });
      setShowForm(false);
      setForm({
        farmerName: "",
        farmerPhone: "",
        cropName: "",
        quantity: "",
        unit: "kg",
        pricePerUnit: "",
        location: "",
        description: "",
      });
      toast({
        title: L(
          "✅ Listing Posted!",
          "✅ लिस्टिंग पोस्ट!",
          "✅ Listing Posted!",
        ),
        description: L(
          "మీ పంట listing successfully add అయింది!",
          "आपकी फसल लिस्ट हो गई!",
          "Your crop listing is now live!",
        ),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/market/listings/${id}`, { method: "DELETE" });
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["/api/market/listings"] }),
  });

  const F =
    (k: keyof typeof form) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-4 text-white">
        <h1 className="text-xl font-bold flex items-center gap-2">
          🛒 {L("రైతు మార్కెట్", "किसान बाजार", "Farmer Market")}
        </h1>
        <p className="text-sm opacity-90 mt-1">
          {L(
            "నేరుగా buyers తో connect అవ్వండి",
            "सीधे buyers से जुड़ें",
            "Connect directly with buyers",
          )}
        </p>
      </div>

      {/* Add Listing Button */}
      {!showForm && (
        <Button
          onClick={() => setShowForm(true)}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white gap-2"
        >
          <Plus size={18} />
          {L(
            "పంట అమ్మకానికి పెట్టండి",
            "फसल बेचने के लिए पोस्ट करें",
            "Post Crop for Sale",
          )}
        </Button>
      )}

      {/* Add Form */}
      {showForm && (
        <Card className="border-orange-200">
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-sm">
                {L(
                  "కొత్త లిస్టింగ్ add చేయండి",
                  "नई लिस्टिंग जोड़ें",
                  "Add New Listing",
                )}
              </h3>
              <button onClick={() => setShowForm(false)}>
                <X size={18} className="text-muted-foreground" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium">
                  {L("మీ పేరు", "आपका नाम", "Your Name")} *
                </label>
                <Input
                  value={form.farmerName}
                  onChange={F("farmerName")}
                  className="mt-1"
                  placeholder={L("రైతు పేరు", "किसान नाम", "Farmer name")}
                />
              </div>
              <div>
                <label className="text-xs font-medium">
                  {L("Phone నంబర్", "फोन नंबर", "Phone Number")} *
                </label>
                <Input
                  value={form.farmerPhone}
                  onChange={F("farmerPhone")}
                  className="mt-1"
                  placeholder="9876543210"
                  type="tel"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium">
                {L("పంట", "फसल", "Crop")} *
              </label>
              <select
                className="w-full mt-1 border rounded-lg p-2 text-sm bg-background"
                value={form.cropName}
                onChange={F("cropName")}
              >
                <option value="">{L("ఎంచుకోండి", "चुनें", "Select")}</option>
                {crops.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs font-medium">
                  {L("పరిమాణం", "मात्रा", "Quantity")} *
                </label>
                <Input
                  value={form.quantity}
                  onChange={F("quantity")}
                  className="mt-1"
                  placeholder="100"
                  type="number"
                />
              </div>
              <div>
                <label className="text-xs font-medium">
                  {L("యూనిట్", "इकाई", "Unit")}
                </label>
                <select
                  className="w-full mt-1 border rounded-lg p-2 text-sm bg-background"
                  value={form.unit}
                  onChange={F("unit")}
                >
                  <option value="kg">Kg</option>
                  <option value="quintal">
                    {L("క్వింటల్", "क्विंटल", "Quintal")}
                  </option>
                  <option value="ton">{L("టన్", "टन", "Ton")}</option>
                  <option value="dozen">{L("డజన్", "दर्जन", "Dozen")}</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium">
                  {L("ధర ₹/యూనిట్", "कीमत ₹/इकाई", "Price ₹/unit")} *
                </label>
                <Input
                  value={form.pricePerUnit}
                  onChange={F("pricePerUnit")}
                  className="mt-1"
                  placeholder="25"
                  type="number"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium">
                {L("స్థలం", "स्थान", "Location")} *
              </label>
              <Input
                value={form.location}
                onChange={F("location")}
                className="mt-1"
                placeholder={L(
                  "గ్రామం, జిల్లా",
                  "गांव, जिला",
                  "Village, District",
                )}
              />
            </div>

            <div>
              <label className="text-xs font-medium">
                {L("వివరణ", "विवरण", "Description")}
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                className="w-full mt-1 border rounded-lg p-2 text-sm bg-background resize-none"
                rows={2}
                placeholder={L(
                  "పంట నాణ్యత గురించి చెప్పండి",
                  "फसल की गुणवत्ता बताएं",
                  "Describe crop quality",
                )}
              />
            </div>

            <Button
              onClick={() => {
                if (
                  !form.farmerName ||
                  !form.farmerPhone ||
                  !form.cropName ||
                  !form.quantity ||
                  !form.pricePerUnit ||
                  !form.location
                ) {
                  toast({
                    title: L(
                      "అన్ని fields fill చేయండి",
                      "सभी fields भरें",
                      "Fill all required fields",
                    ),
                    variant: "destructive",
                  });
                  return;
                }
                createMutation.mutate(form);
              }}
              disabled={createMutation.isPending}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            >
              {createMutation.isPending ? (
                <Loader2 className="animate-spin mr-2" size={16} />
              ) : (
                <Plus size={16} className="mr-2" />
              )}
              {L("Post చేయండి", "पोस्ट करें", "Post Listing")}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Listings */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-orange-500" size={32} />
        </div>
      )}

      {!isLoading && listings.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <ShoppingBag
              size={40}
              className="mx-auto text-muted-foreground mb-3"
            />
            <p className="text-muted-foreground text-sm">
              {L(
                "ఇంకా listings లేవు",
                "अभी कोई लिस्टिंग नहीं",
                "No listings yet",
              )}
            </p>
          </CardContent>
        </Card>
      )}

      {listings.map((item) => (
        <Card
          key={item.id}
          className="border-orange-100 hover:shadow-md transition-shadow"
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className="text-2xl">🌾</span>
                  <div>
                    <h3 className="font-bold text-base">{item.cropName}</h3>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <Badge className="bg-orange-100 text-orange-800 ml-auto">
                    ₹{item.pricePerUnit}/{item.unit}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-1 mb-3">
                  <p className="text-sm">
                    <span className="text-muted-foreground">
                      {L("పరిమాణం:", "मात्रा:", "Qty:")}{" "}
                    </span>
                    <span className="font-medium">
                      {item.quantity} {item.unit}
                    </span>
                  </p>
                  <p className="text-sm flex items-center gap-1">
                    <MapPin size={12} className="text-muted-foreground" />
                    <span className="truncate">{item.location}</span>
                  </p>
                </div>

                {item.description && (
                  <p className="text-xs text-muted-foreground mb-3">
                    {item.description}
                  </p>
                )}

                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.farmerName}</p>
                  </div>
                  <a
                    href={`tel:${item.farmerPhone}`}
                    className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-2 rounded-lg font-medium"
                  >
                    <Phone size={14} />
                    {L("Call చేయండి", "Call करें", "Call")}
                  </a>
                  <a
                    href={`https://wa.me/91${item.farmerPhone}?text=${encodeURIComponent(`Hi, I saw your ${item.cropName} listing on KrishiHealth. I am interested to buy ${item.quantity} ${item.unit} at ₹${item.pricePerUnit}/${item.unit}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 bg-[#25D366] hover:bg-[#20b858] text-white text-xs px-3 py-2 rounded-lg font-medium"
                  >
                    💬 WhatsApp
                  </a>
                  <button
                    onClick={() => deleteMutation.mutate(item.id)}
                    className="p-2 text-red-400 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
