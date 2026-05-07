import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Tractor,
  Plus,
  Phone,
  MapPin,
  Trash2,
  Loader2,
  X,
  Calendar,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { Language } from "@/lib/language";

interface Equipment {
  id: number;
  ownerName: string;
  ownerPhone: string;
  equipmentName: string;
  type: string;
  pricePerDay: string;
  location: string;
  available: boolean;
  description: string;
  createdAt: string;
}
interface Booking {
  id: number;
  equipmentId: number;
  equipmentName: string;
  farmerName: string;
  farmerPhone: string;
  date: string;
  days: string;
  totalPrice: string;
  createdAt: string;
}

export default function EquipmentPage({ language }: { language: Language }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const L = (te: string, hi: string, en: string) =>
    language === "te" ? te : language === "hi" ? hi : en;

  // Phone based identity
  const [myPhone, setMyPhone] = useState(
    () => localStorage.getItem("equip_phone") || "",
  );
  const [phoneInput, setPhoneInput] = useState("");
  const [tab, setTab] = useState<"browse" | "mine" | "bookings">("browse");
  const [showForm, setShowForm] = useState(false);
  const [bookingItem, setBookingItem] = useState<Equipment | null>(null);

  const [form, setForm] = useState({
    ownerName: "",
    ownerPhone: myPhone,
    equipmentName: "",
    type: "tractor",
    pricePerDay: "",
    location: "",
    description: "",
    available: true,
  });
  const [bookForm, setBookForm] = useState({
    farmerName: "",
    farmerPhone: myPhone,
    date: "",
    days: "1",
  });

  const { data: allEquipment = [] } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
  });
  const { data: allBookings = [] } = useQuery<Booking[]>({
    queryKey: ["/api/equipment/bookings"],
  });

  // Filter by phone
  const myEquipment = allEquipment.filter((e) => e.ownerPhone === myPhone);
  const myBookings = allBookings.filter((b) => b.farmerPhone === myPhone);
  const availableEquipment = allEquipment.filter((e) => e.available);

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await fetch("/api/equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, ownerPhone: myPhone }),
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/equipment"] });
      setShowForm(false);
      setForm({
        ownerName: "",
        ownerPhone: myPhone,
        equipmentName: "",
        type: "tractor",
        pricePerDay: "",
        location: "",
        description: "",
        available: true,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/equipment/${id}`, { method: "DELETE" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/equipment"] }),
  });

  const bookMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof bookForm }) => {
      const res = await fetch(`/api/equipment/${id}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, farmerPhone: myPhone }),
      });
      if (!res.ok) throw new Error("Booking failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/equipment/bookings"] });
      setBookingItem(null);
      setBookForm({
        farmerName: "",
        farmerPhone: myPhone,
        date: "",
        days: "1",
      });
      alert(
        L(
          "విజయవంతంగా book అయింది!",
          "सफलतापूर्वक बुक हो गया!",
          "Booked successfully!",
        ),
      );
    },
    onError: () => alert(L("Booking failed", "बुकिंग विफल", "Booking failed")),
  });

  const equipTypes = [
    {
      value: "tractor",
      label: L("ట్రాక్టర్", "ट्रैक्टर", "Tractor"),
      emoji: "🚜",
    },
    {
      value: "harvester",
      label: L("హార్వెస్టర్", "हार्वेस्टर", "Harvester"),
      emoji: "🌾",
    },
    {
      value: "sprayer",
      label: L("స్ప్రేయర్", "स्प्रेयर", "Sprayer"),
      emoji: "💧",
    },
    {
      value: "thresher",
      label: L("థ్రెషర్", "थ्रेशर", "Thresher"),
      emoji: "⚙️",
    },
    { value: "pump", label: L("పంప్", "पंप", "Water Pump"), emoji: "🔧" },
    { value: "other", label: L("ఇతర", "अन्य", "Other"), emoji: "🛠️" },
  ];
  const getEmoji = (type: string) =>
    equipTypes.find((t) => t.value === type)?.emoji || "🛠️";
  const getLabel = (type: string) =>
    equipTypes.find((t) => t.value === type)?.label || type;

  // Phone login screen
  if (!myPhone) {
    return (
      <div className="space-y-4 pb-8">
        <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-xl p-4 text-white">
          <h1 className="text-xl font-bold">
            🚜 {L("పరికరాల అద్దె", "उपकरण किराया", "Equipment Rental")}
          </h1>
        </div>
        <Card>
          <CardContent className="pt-4 space-y-3">
            <p className="text-sm font-medium">
              {L(
                "మీ Phone నంబర్ enter చేయండి",
                "अपना फोन नंबर दर्ज करें",
                "Enter your phone number",
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              {L(
                "మీరు add చేసిన equipment మరియు bookings చూడడానికి",
                "अपने equipment और bookings देखने के लिए",
                "To see your equipment and bookings",
              )}
            </p>
            <Input
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="9876543210"
              type="tel"
              maxLength={10}
            />
            <Button
              onClick={() => {
                if (phoneInput.length !== 10) {
                  alert(
                    L(
                      "10 digit number enter చేయండి",
                      "10 अंक दर्ज करें",
                      "Enter 10 digit number",
                    ),
                  );
                  return;
                }
                setMyPhone(phoneInput);
                localStorage.setItem("equip_phone", phoneInput);
                setForm((p) => ({ ...p, ownerPhone: phoneInput }));
                setBookForm((p) => ({ ...p, farmerPhone: phoneInput }));
              }}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              {L("Continue చేయండి", "जारी रखें", "Continue")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-xl p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">
              🚜 {L("పరికరాల అద్దె", "उपकरण किराया", "Equipment Rental")}
            </h1>
            <p className="text-xs opacity-80 mt-1">📞 {myPhone}</p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem("equip_phone");
              setMyPhone("");
              setPhoneInput("");
            }}
            className="text-xs bg-white/20 px-2 py-1 rounded"
          >
            {L("Change", "बदलें", "Change")}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl overflow-hidden border">
        {[
          {
            key: "browse",
            label: L("అద్దె తీసుకోండి", "किराए पर लें", "Browse"),
          },
          {
            key: "mine",
            label: L("నా పరికరాలు", "मेरे उपकरण", "My Equipment"),
          },
          {
            key: "bookings",
            label: L("నా Bookings", "मेरी बुकिंग", "My Bookings"),
          },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`flex-1 py-2.5 text-xs font-bold transition-colors ${tab === t.key ? "bg-yellow-600 text-white" : "bg-background text-muted-foreground"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ══ BROWSE TAB ══ */}
      {tab === "browse" && (
        <div className="space-y-3">
          {availableEquipment.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <Tractor
                  size={40}
                  className="mx-auto text-muted-foreground mb-3"
                />
                <p className="text-muted-foreground text-sm">
                  {L(
                    "ఇంకా పరికరాలు లేవు",
                    "अभी कोई उपकरण नहीं",
                    "No equipment yet",
                  )}
                </p>
              </CardContent>
            </Card>
          )}
          {availableEquipment.map((item) => (
            <Card
              key={item.id}
              className="border-yellow-100 hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{getEmoji(item.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-base">
                          {item.equipmentName}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {getLabel(item.type)}
                        </p>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800 shrink-0">
                        ₹{item.pricePerDay}/{L("రోజు", "दिन", "day")}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <MapPin size={11} />
                      <span>{item.location}</span>
                    </div>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-3">
                      <p className="text-sm font-medium flex-1">
                        {item.ownerName}
                      </p>
                      <a
                        href={`tel:${item.ownerPhone}`}
                        className="flex items-center gap-1 bg-green-600 text-white text-xs px-3 py-2 rounded-lg"
                      >
                        <Phone size={13} /> {L("Call", "Call", "Call")}
                      </a>
                      <a
                        href={`https://wa.me/91${item.ownerPhone}?text=${encodeURIComponent(`Hi, I want to rent ${item.equipmentName}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#25D366] text-white text-xs px-3 py-2 rounded-lg"
                      >
                        💬 WA
                      </a>
                      {item.ownerPhone !== myPhone && (
                        <Button
                          onClick={() => setBookingItem(item)}
                          size="sm"
                          className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs"
                        >
                          <Calendar size={13} className="mr-1" />
                          {L("Book", "बुक", "Book")}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ══ MY EQUIPMENT TAB ══ */}
      {tab === "mine" && (
        <div className="space-y-3">
          {!showForm && (
            <Button
              onClick={() => setShowForm(true)}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white gap-2"
            >
              <Plus size={18} />
              {L(
                "పరికరం register చేయండి",
                "उपकरण रजिस्टर करें",
                "Register Equipment",
              )}
            </Button>
          )}

          {showForm && (
            <Card className="border-yellow-200">
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm">
                    {L("పరికరం add చేయండి", "उपकरण जोड़ें", "Add Equipment")}
                  </h3>
                  <button onClick={() => setShowForm(false)}>
                    <X size={18} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium">
                      {L("మీ పేరు", "आपका नाम", "Your Name")} *
                    </label>
                    <Input
                      value={form.ownerName}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, ownerName: e.target.value }))
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium">
                      {L("పరికరం పేరు", "उपकरण नाम", "Equipment Name")} *
                    </label>
                    <Input
                      value={form.equipmentName}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          equipmentName: e.target.value,
                        }))
                      }
                      className="mt-1"
                      placeholder="John Deere Tractor"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium">
                      {L("రకం", "प्रकार", "Type")}
                    </label>
                    <select
                      className="w-full mt-1 border rounded-lg p-2 text-sm bg-background"
                      value={form.type}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, type: e.target.value }))
                      }
                    >
                      {equipTypes.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.emoji} {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium">
                      {L("రోజు ధర ₹", "दिन की कीमत ₹", "Price/day ₹")} *
                    </label>
                    <Input
                      value={form.pricePerDay}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, pricePerDay: e.target.value }))
                      }
                      className="mt-1"
                      type="number"
                      placeholder="500"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium">
                    {L("స్థలం", "स्थान", "Location")} *
                  </label>
                  <Input
                    value={form.location}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, location: e.target.value }))
                    }
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
                  />
                </div>
                <Button
                  onClick={() => {
                    if (
                      !form.ownerName ||
                      !form.equipmentName ||
                      !form.pricePerDay ||
                      !form.location
                    ) {
                      alert(
                        L(
                          "అన్ని * fields fill చేయండి",
                          "सभी * fields भरें",
                          "Fill all * fields",
                        ),
                      );
                      return;
                    }
                    createMutation.mutate(form);
                  }}
                  disabled={createMutation.isPending}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="animate-spin mr-2" size={16} />
                  ) : (
                    <Plus size={16} className="mr-2" />
                  )}
                  {L("Register చేయండి", "रजिस्टर करें", "Register")}
                </Button>
              </CardContent>
            </Card>
          )}

          {myEquipment.length === 0 && !showForm && (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <Tractor
                  size={40}
                  className="mx-auto text-muted-foreground mb-3"
                />
                <p className="text-muted-foreground text-sm">
                  {L(
                    "మీరు ఇంకా పరికరాలు add చేయలేదు",
                    "आपने कोई उपकरण नहीं जोड़ा",
                    "You haven't added equipment yet",
                  )}
                </p>
              </CardContent>
            </Card>
          )}

          {myEquipment.map((item) => (
            <Card key={item.id} className="border-yellow-100">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getEmoji(item.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">{item.equipmentName}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.location} • ₹{item.pricePerDay}/
                      {L("రోజు", "दिन", "day")}
                    </p>
                  </div>
                  <Badge
                    className={
                      item.available
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }
                  >
                    {item.available
                      ? L("Available", "उपलब्ध", "Available")
                      : L("Booked", "बुक्ड", "Booked")}
                  </Badge>
                  <button
                    onClick={() => deleteMutation.mutate(item.id)}
                    className="p-1.5 text-red-400 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ══ MY BOOKINGS TAB ══ */}
      {tab === "bookings" && (
        <div className="space-y-3">
          {myBookings.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <Calendar
                  size={40}
                  className="mx-auto text-muted-foreground mb-3"
                />
                <p className="text-muted-foreground text-sm">
                  {L(
                    "మీరు ఇంకా book చేయలేదు",
                    "आपने अभी बुकिंग नहीं की",
                    "You haven't made any bookings",
                  )}
                </p>
              </CardContent>
            </Card>
          )}
          {myBookings.map((b) => (
            <Card key={b.id} className="border-yellow-100">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-sm">{b.equipmentName}</p>
                    <p className="text-xs text-muted-foreground">
                      📅 {b.date} • {b.days} {L("రోజులు", "दिन", "days")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {L("మీ పేరు:", "आपका नाम:", "Name:")} {b.farmerName}
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-800 shrink-0">
                    ₹{b.totalPrice}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ══ BOOKING MODAL ══ */}
      {bookingItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-background w-full rounded-t-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">{bookingItem.equipmentName}</h3>
              <button onClick={() => setBookingItem(null)}>
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              ₹{bookingItem.pricePerDay}/{L("రోజు", "दिन", "day")} •{" "}
              {bookingItem.location}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium">
                  {L("మీ పేరు", "आपका नाम", "Your Name")} *
                </label>
                <Input
                  value={bookForm.farmerName}
                  onChange={(e) =>
                    setBookForm((p) => ({ ...p, farmerName: e.target.value }))
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium">
                  {L("తేదీ", "तारीख", "Date")} *
                </label>
                <Input
                  value={bookForm.date}
                  onChange={(e) =>
                    setBookForm((p) => ({ ...p, date: e.target.value }))
                  }
                  className="mt-1"
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium">
                {L("రోజులు", "दिन", "Days")} *
              </label>
              <Input
                value={bookForm.days}
                onChange={(e) =>
                  setBookForm((p) => ({ ...p, days: e.target.value }))
                }
                className="mt-1"
                type="number"
                min="1"
                max="30"
              />
            </div>
            {bookForm.days && (
              <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded-lg p-3">
                <p className="text-sm font-bold">
                  {L("మొత్తం:", "कुल:", "Total:")} ₹
                  {Number(bookingItem.pricePerDay) * Number(bookForm.days)}
                </p>
              </div>
            )}
            <Button
              onClick={() => {
                if (!bookForm.farmerName || !bookForm.date || !bookForm.days) {
                  alert(
                    L(
                      "అన్ని fields fill చేయండి",
                      "सभी fields भरें",
                      "Fill all fields",
                    ),
                  );
                  return;
                }
                bookMutation.mutate({ id: bookingItem.id, data: bookForm });
              }}
              disabled={bookMutation.isPending}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              {bookMutation.isPending ? (
                <Loader2 className="animate-spin mr-2" size={16} />
              ) : (
                <Calendar size={16} className="mr-2" />
              )}
              {L("Confirm Booking", "बुकिंग कन्फर्म करें", "Confirm Booking")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
