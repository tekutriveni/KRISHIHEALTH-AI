import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Factory,
  Plus,
  Clock,
  Users,
  Ticket,
  Loader2,
  X,
  ChevronRight,
  LogIn,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Language } from "@/lib/language";

interface Mill {
  id: number;
  ownerName: string;
  phone: string;
  millName: string;
  location: string;
  district: string;
  state: string;
  capacity: string;
  active: boolean;
}
interface MillSlot {
  id: number;
  millId: number;
  millName: string;
  date: string;
  timeStart: string;
  timeEnd: string;
  totalCapacity: number;
  bookedCount: number;
  pricePerQuintal: string;
  active: boolean;
}
interface MillBooking {
  id: number;
  slotId: number;
  millName: string;
  date: string;
  timeStart: string;
  timeEnd: string;
  farmerName: string;
  farmerPhone: string;
  village: string;
  quantity: string;
  tokenNumber: number;
  status: string;
}

interface Props {
  language: Language;
}

const TIMES = [
  "6:00 AM",
  "7:00 AM",
  "8:00 AM",
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
  "6:00 PM",
];

export default function MillBook({ language }: Props) {
  const qc = useQueryClient();
  const L = (te: string, hi: string, en: string) =>
    language === "te" ? te : language === "hi" ? hi : en;

  // Tabs
  const [tab, setTab] = useState<"farmer" | "miller">("farmer");

  // Farmer state
  const [farmerPhone, setFarmerPhone] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<MillSlot | null>(null);
  const [bookForm, setBookForm] = useState({
    farmerName: "",
    farmerPhone: "",
    village: "",
    quantity: "",
  });
  const [bookedTicket, setBookedTicket] = useState<MillBooking | null>(null);

  // Miller state
  const [millerLogged, setMillerLogged] = useState<Mill | null>(null);
  const [millerTab, setMillerTab] = useState<
    "login" | "register" | "dashboard"
  >("login");
  const [loginForm, setLoginForm] = useState({ phone: "", password: "" });
  const [regForm, setRegForm] = useState({
    ownerName: "",
    phone: "",
    millName: "",
    location: "",
    district: "",
    state: "Telangana",
    capacity: "100",
    password: "",
  });
  const [slotForm, setSlotForm] = useState({
    date: "",
    timeStart: "8:00 AM",
    timeEnd: "9:00 AM",
    totalCapacity: "10",
    pricePerQuintal: "0",
  });
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [viewSlot, setViewSlot] = useState<MillSlot | null>(null);

  // ── Queries ──────────────────────────────────────────────────
  const { data: allSlots = [] } = useQuery<MillSlot[]>({
    queryKey: ["/api/slots"],
  });

  const { data: millerSlots = [] } = useQuery<MillSlot[]>({
    queryKey: [`/api/mills/${millerLogged?.id}/slots`],
    enabled: !!millerLogged,
  });

  const { data: farmerBookings = [] } = useQuery<MillBooking[]>({
    queryKey: [`/api/mill-bookings/farmer/${searchPhone}`],
    enabled: searchPhone.length === 10,
  });

  const { data: slotBookings = [] } = useQuery<MillBooking[]>({
    queryKey: [`/api/slots/${viewSlot?.id}/bookings`],
    enabled: !!viewSlot,
  });

  // ── Mutations ─────────────────────────────────────────────────
  const loginMutation = useMutation({
    mutationFn: async (data: typeof loginForm) => {
      const res = await fetch("/api/mills/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Login failed");
      return res.json();
    },
    onSuccess: (data) => {
      setMillerLogged(data.mill);
      setMillerTab("dashboard");
    },
    onError: () =>
      alert(
        L(
          "Phone లేదా Password తప్పు!",
          "गलत phone या password!",
          "Wrong phone or password!",
        ),
      ),
  });

  const registerMutation = useMutation({
    mutationFn: async (data: typeof regForm) => {
      const res = await fetch("/api/mills/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: (data) => {
      setMillerLogged(data.mill);
      setMillerTab("dashboard");
    },
  });

  const createSlotMutation = useMutation({
    mutationFn: async (data: typeof slotForm) => {
      const res = await fetch(`/api/mills/${millerLogged!.id}/slots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          millName: millerLogged!.millName,
          totalCapacity: Number(data.totalCapacity),
        }),
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: [`/api/mills/${millerLogged?.id}/slots`],
      });
      qc.invalidateQueries({ queryKey: ["/api/slots"] });
      setShowSlotForm(false);
      setSlotForm({
        date: "",
        timeStart: "8:00 AM",
        timeEnd: "9:00 AM",
        totalCapacity: "10",
        pricePerQuintal: "0",
      });
    },
  });

  const deleteSlotMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/slots/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: [`/api/mills/${millerLogged?.id}/slots`],
      });
      qc.invalidateQueries({ queryKey: ["/api/slots"] });
    },
  });

  const bookMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/slots/${selectedSlot!.id}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookForm),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      return res.json();
    },
    onSuccess: (data) => {
      setBookedTicket(data.booking);
      setSelectedSlot(null);
      qc.invalidateQueries({ queryKey: ["/api/slots"] });
    },
    onError: (e: any) => alert(e.message || "Booking failed"),
  });

  const available = allSlots.filter((s) => s.bookedCount < s.totalCapacity);
  const full = allSlots.filter((s) => s.bookedCount >= s.totalCapacity);

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-stone-700 to-stone-800 rounded-xl p-4 text-white">
        <h1 className="text-xl font-bold flex items-center gap-2">
          🏭{" "}
          {L(
            "రైస్ మిల్ స్లాట్ బుకింగ్",
            "राइस मिल स्लॉट बुकिंग",
            "Rice Mill Slot Booking",
          )}
        </h1>
        <p className="text-sm opacity-90 mt-1">
          {L(
            "Line లేకుండా మీ సమయంలో వెళ్ళండి",
            "लाइन में खड़े न हों, अपने समय पर जाएं",
            "No waiting — go at your booked time",
          )}
        </p>
      </div>

      {/* Main Tabs */}
      <div className="flex rounded-xl overflow-hidden border">
        <button
          onClick={() => setTab("farmer")}
          className={`flex-1 py-3 text-sm font-bold transition-colors ${tab === "farmer" ? "bg-green-600 text-white" : "bg-background text-muted-foreground"}`}
        >
          👨‍🌾 {L("రైతు", "किसान", "Farmer")}
        </button>
        <button
          onClick={() => setTab("miller")}
          className={`flex-1 py-3 text-sm font-bold transition-colors ${tab === "miller" ? "bg-stone-700 text-white" : "bg-background text-muted-foreground"}`}
        >
          🏭 {L("మిల్లర్", "मिलर", "Miller")}
        </button>
      </div>

      {/* ══════════ FARMER TAB ══════════ */}
      {tab === "farmer" && (
        <div className="space-y-4">
          {/* Booked Ticket Success */}
          {bookedTicket && (
            <Card className="border-green-400 bg-green-50 dark:bg-green-950/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="text-green-600" size={24} />
                  <h3 className="font-bold text-green-800 dark:text-green-300">
                    {L(
                      "Booking Confirmed!",
                      "बुकिंग कन्फर्म!",
                      "Booking Confirmed!",
                    )}
                  </h3>
                </div>
                <div className="bg-white dark:bg-green-900/30 rounded-xl p-4 text-center space-y-2 border border-green-200">
                  <div className="text-5xl font-black text-green-700">
                    #{bookedTicket.tokenNumber}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {L(
                      "మీ టోకెన్ నంబర్",
                      "आपका टोकन नंबर",
                      "Your Token Number",
                    )}
                  </p>
                  <div className="border-t pt-2 space-y-1">
                    <p className="text-sm font-bold">{bookedTicket.millName}</p>
                    <p className="text-sm">📅 {bookedTicket.date}</p>
                    <p className="text-sm">
                      🕐 {bookedTicket.timeStart} - {bookedTicket.timeEnd}
                    </p>
                    <p className="text-sm">
                      🌾 {bookedTicket.quantity}{" "}
                      {L("క్వింటాళ్లు", "क्विंटल", "quintals")}
                    </p>
                  </div>
                  <p className="text-xs text-green-700 font-medium mt-2">
                    📱{" "}
                    {L(
                      "SMS మీ phone కి వెళ్ళింది!",
                      "SMS आपके phone पर गया!",
                      "SMS sent to your phone!",
                    )}
                  </p>
                </div>
                <Button
                  onClick={() => setBookedTicket(null)}
                  variant="outline"
                  className="w-full mt-3"
                >
                  {L("మరొక Slot చూడండి", "और स्लॉट देखें", "View More Slots")}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* My Bookings Search */}
          <Card>
            <CardContent className="pt-4 space-y-2">
              <p className="text-sm font-bold">
                {L("నా Bookings చూడండి", "मेरी बुकिंग देखें", "My Bookings")}
              </p>
              <div className="flex gap-2">
                <Input
                  value={farmerPhone}
                  onChange={(e) => setFarmerPhone(e.target.value)}
                  placeholder={L("Phone నంబర్", "फोन नंबर", "Phone number")}
                  type="tel"
                  maxLength={10}
                />
                <Button
                  onClick={() => setSearchPhone(farmerPhone)}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {L("చూడు", "देखें", "Search")}
                </Button>
              </div>
              {farmerBookings.map((b) => (
                <div
                  key={b.id}
                  className="border rounded-lg p-3 bg-green-50 dark:bg-green-950/20"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm">{b.millName}</p>
                      <p className="text-xs text-muted-foreground">
                        📅 {b.date} | 🕐 {b.timeStart}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        🌾 {b.quantity} quintals
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-black text-green-700">
                        #{b.tokenNumber}
                      </div>
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        Token
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Available Slots */}
          <div>
            <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
              <Ticket size={16} className="text-green-600" />
              {L("అందుబాటులో ఉన్న Slots", "उपलब्ध स्लॉट", "Available Slots")} (
              {available.length})
            </h3>

            {available.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="p-6 text-center">
                  <Factory
                    size={36}
                    className="mx-auto text-muted-foreground mb-2"
                  />
                  <p className="text-sm text-muted-foreground">
                    {L(
                      "ఇంకా slots లేవు",
                      "अभी कोई स्लॉट नहीं",
                      "No slots available yet",
                    )}
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="space-y-3">
              {available.map((slot) => {
                const pct = Math.round(
                  (slot.bookedCount / slot.totalCapacity) * 100,
                );
                const remaining = slot.totalCapacity - slot.bookedCount;
                return (
                  <Card
                    key={slot.id}
                    className="border-green-100 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedSlot(slot);
                      setBookForm((p) => ({ ...p, farmerPhone }));
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">🏭</span>
                            <div>
                              <p className="font-bold text-sm">
                                {slot.millName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                📅 {slot.date} | 🕐 {slot.timeStart} -{" "}
                                {slot.timeEnd}
                              </p>
                            </div>
                          </div>
                          {/* Capacity bar like movie seats */}
                          <div className="mt-2">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-green-600 font-medium">
                                {remaining}{" "}
                                {L(
                                  "స్లాట్లు మిగిలాయి",
                                  "स्लॉट बचे हैं",
                                  "slots remaining",
                                )}
                              </span>
                              <span className="text-muted-foreground">
                                {slot.bookedCount}/{slot.totalCapacity}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${pct > 70 ? "bg-red-500" : pct > 40 ? "bg-yellow-500" : "bg-green-500"}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                          {slot.pricePerQuintal !== "0" && (
                            <p className="text-xs text-muted-foreground mt-1">
                              💰 ₹{slot.pricePerQuintal}/
                              {L("క్వింటాల్", "क्विंटल", "quintal")}
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white shrink-0"
                        >
                          {L("Book", "बुक", "Book")}
                          <ChevronRight size={14} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Full Slots */}
          {full.length > 0 && (
            <div>
              <h3 className="font-bold text-sm mb-2 text-red-600">
                {L("Full అయిన Slots", "भरे हुए स्लॉट", "Full Slots")} (
                {full.length})
              </h3>
              {full.map((slot) => (
                <Card key={slot.id} className="border-red-100 opacity-60 mb-2">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm">{slot.millName}</p>
                        <p className="text-xs text-muted-foreground">
                          📅 {slot.date} | 🕐 {slot.timeStart}
                        </p>
                      </div>
                      <Badge className="bg-red-100 text-red-800">
                        {L("Full", "भरा", "Full")}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════ MILLER TAB ══════════ */}
      {tab === "miller" && (
        <div className="space-y-4">
          {/* Login / Register */}
          {!millerLogged && (
            <>
              <div className="flex rounded-xl overflow-hidden border">
                <button
                  onClick={() => setMillerTab("login")}
                  className={`flex-1 py-2.5 text-xs font-bold ${millerTab === "login" ? "bg-stone-700 text-white" : "bg-background text-muted-foreground"}`}
                >
                  {L("Login", "लॉगिन", "Login")}
                </button>
                <button
                  onClick={() => setMillerTab("register")}
                  className={`flex-1 py-2.5 text-xs font-bold ${millerTab === "register" ? "bg-stone-700 text-white" : "bg-background text-muted-foreground"}`}
                >
                  {L("Register", "रजिस्टर", "Register")}
                </button>
              </div>

              {millerTab === "login" && (
                <Card>
                  <CardContent className="pt-4 space-y-3">
                    <div>
                      <label className="text-xs font-medium">
                        {L("Mill Phone", "मिल फोन", "Mill Phone")} *
                      </label>
                      <Input
                        value={loginForm.phone}
                        onChange={(e) =>
                          setLoginForm((p) => ({ ...p, phone: e.target.value }))
                        }
                        className="mt-1"
                        placeholder="9876543210"
                        type="tel"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium">
                        {L("Password", "पासवर्ड", "Password")} *
                      </label>
                      <Input
                        value={loginForm.password}
                        onChange={(e) =>
                          setLoginForm((p) => ({
                            ...p,
                            password: e.target.value,
                          }))
                        }
                        className="mt-1"
                        type="password"
                        placeholder="••••••"
                      />
                    </div>
                    <Button
                      onClick={() => loginMutation.mutate(loginForm)}
                      disabled={loginMutation.isPending}
                      className="w-full bg-stone-700 hover:bg-stone-800 text-white"
                    >
                      {loginMutation.isPending ? (
                        <Loader2 className="animate-spin mr-2" size={16} />
                      ) : (
                        <LogIn size={16} className="mr-2" />
                      )}
                      {L("Login", "लॉगिन", "Login")}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {millerTab === "register" && (
                <Card>
                  <CardContent className="pt-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-medium">
                          {L("మీ పేరు", "आपका नाम", "Your Name")} *
                        </label>
                        <Input
                          value={regForm.ownerName}
                          onChange={(e) =>
                            setRegForm((p) => ({
                              ...p,
                              ownerName: e.target.value,
                            }))
                          }
                          className="mt-1"
                          placeholder={L("పేరు", "नाम", "Name")}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium">
                          {L("Phone", "फोन", "Phone")} *
                        </label>
                        <Input
                          value={regForm.phone}
                          onChange={(e) =>
                            setRegForm((p) => ({ ...p, phone: e.target.value }))
                          }
                          className="mt-1"
                          placeholder="9876543210"
                          type="tel"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium">
                        {L("Mill పేరు", "मिल का नाम", "Mill Name")} *
                      </label>
                      <Input
                        value={regForm.millName}
                        onChange={(e) =>
                          setRegForm((p) => ({
                            ...p,
                            millName: e.target.value,
                          }))
                        }
                        className="mt-1"
                        placeholder={L(
                          "eg: Sri Lakshmi Rice Mill",
                          "eg: Lakshmi Rice Mill",
                          "eg: Sri Lakshmi Rice Mill",
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-medium">
                          {L("గ్రామం/స్థలం", "गांव/स्थान", "Village/Location")}{" "}
                          *
                        </label>
                        <Input
                          value={regForm.location}
                          onChange={(e) =>
                            setRegForm((p) => ({
                              ...p,
                              location: e.target.value,
                            }))
                          }
                          className="mt-1"
                          placeholder={L("గ్రామం", "गांव", "Village")}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium">
                          {L("జిల్లా", "जिला", "District")} *
                        </label>
                        <Input
                          value={regForm.district}
                          onChange={(e) =>
                            setRegForm((p) => ({
                              ...p,
                              district: e.target.value,
                            }))
                          }
                          className="mt-1"
                          placeholder={L("జిల్లా", "जिला", "District")}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-medium">
                          {L(
                            "రోజు Capacity (tractors)",
                            "दिन की क्षमता",
                            "Daily Capacity",
                          )}{" "}
                          *
                        </label>
                        <Input
                          value={regForm.capacity}
                          onChange={(e) =>
                            setRegForm((p) => ({
                              ...p,
                              capacity: e.target.value,
                            }))
                          }
                          className="mt-1"
                          type="number"
                          placeholder="100"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium">
                          {L("Password", "पासवर्ड", "Password")} *
                        </label>
                        <Input
                          value={regForm.password}
                          onChange={(e) =>
                            setRegForm((p) => ({
                              ...p,
                              password: e.target.value,
                            }))
                          }
                          className="mt-1"
                          type="password"
                          placeholder="••••••"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        if (
                          !regForm.ownerName ||
                          !regForm.phone ||
                          !regForm.millName ||
                          !regForm.location ||
                          !regForm.district ||
                          !regForm.password
                        ) {
                          alert(
                            L(
                              "అన్ని fields fill చేయండి",
                              "सभी fields भरें",
                              "Fill all fields",
                            ),
                          );
                          return;
                        }
                        registerMutation.mutate(regForm);
                      }}
                      disabled={registerMutation.isPending}
                      className="w-full bg-stone-700 hover:bg-stone-800 text-white"
                    >
                      {registerMutation.isPending ? (
                        <Loader2 className="animate-spin mr-2" size={16} />
                      ) : (
                        <Plus size={16} className="mr-2" />
                      )}
                      {L(
                        "Mill Register చేయండి",
                        "मिल रजिस्टर करें",
                        "Register Mill",
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Miller Dashboard */}
          {millerLogged && (
            <div className="space-y-4">
              <Card className="border-stone-200 bg-stone-50 dark:bg-stone-950/20">
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <p className="font-bold">{millerLogged.millName}</p>
                    <p className="text-xs text-muted-foreground">
                      {millerLogged.location}, {millerLogged.district}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setMillerLogged(null)}
                  >
                    {L("Logout", "लॉगआउट", "Logout")}
                  </Button>
                </CardContent>
              </Card>

              {/* Add Slot */}
              {!showSlotForm && (
                <Button
                  onClick={() => setShowSlotForm(true)}
                  className="w-full bg-stone-700 hover:bg-stone-800 text-white gap-2"
                >
                  <Plus size={18} />
                  {L(
                    "కొత్త Slot Add చేయండి",
                    "नया स्लॉट जोड़ें",
                    "Add New Slot",
                  )}
                </Button>
              )}

              {showSlotForm && (
                <Card className="border-stone-200">
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm">
                        {L("Slot Create చేయండి", "स्लॉट बनाएं", "Create Slot")}
                      </h3>
                      <button onClick={() => setShowSlotForm(false)}>
                        <X size={18} />
                      </button>
                    </div>
                    <div>
                      <label className="text-xs font-medium">
                        {L("తేదీ", "तारीख", "Date")} *
                      </label>
                      <Input
                        value={slotForm.date}
                        onChange={(e) =>
                          setSlotForm((p) => ({ ...p, date: e.target.value }))
                        }
                        className="mt-1"
                        type="date"
                        min={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-medium">
                          {L("Start Time", "शुरू समय", "Start Time")}
                        </label>
                        <select
                          className="w-full mt-1 border rounded-lg p-2 text-sm bg-background"
                          value={slotForm.timeStart}
                          onChange={(e) =>
                            setSlotForm((p) => ({
                              ...p,
                              timeStart: e.target.value,
                            }))
                          }
                        >
                          {TIMES.map((t) => (
                            <option key={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium">
                          {L("End Time", "खत्म समय", "End Time")}
                        </label>
                        <select
                          className="w-full mt-1 border rounded-lg p-2 text-sm bg-background"
                          value={slotForm.timeEnd}
                          onChange={(e) =>
                            setSlotForm((p) => ({
                              ...p,
                              timeEnd: e.target.value,
                            }))
                          }
                        >
                          {TIMES.map((t) => (
                            <option key={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-medium">
                          {L(
                            "Max Farmers ఈ slot లో",
                            "इस स्लॉट में max farmers",
                            "Max Farmers/slot",
                          )}
                        </label>
                        <Input
                          value={slotForm.totalCapacity}
                          onChange={(e) =>
                            setSlotForm((p) => ({
                              ...p,
                              totalCapacity: e.target.value,
                            }))
                          }
                          className="mt-1"
                          type="number"
                          placeholder="10"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium">
                          {L(
                            "ధర ₹/క్వింటాల్",
                            "कीमत ₹/क्विंटल",
                            "Price ₹/quintal",
                          )}
                        </label>
                        <Input
                          value={slotForm.pricePerQuintal}
                          onChange={(e) =>
                            setSlotForm((p) => ({
                              ...p,
                              pricePerQuintal: e.target.value,
                            }))
                          }
                          className="mt-1"
                          type="number"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        if (!slotForm.date) {
                          alert(
                            L(
                              "తేదీ select చేయండి",
                              "तारीख चुनें",
                              "Select date",
                            ),
                          );
                          return;
                        }
                        createSlotMutation.mutate(slotForm);
                      }}
                      disabled={createSlotMutation.isPending}
                      className="w-full bg-stone-700 hover:bg-stone-800 text-white"
                    >
                      {createSlotMutation.isPending ? (
                        <Loader2 className="animate-spin mr-2" size={16} />
                      ) : (
                        <Clock size={16} className="mr-2" />
                      )}
                      {L("Slot Create చేయండి", "स्लॉट बनाएं", "Create Slot")}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Miller's Slots */}
              <h3 className="font-bold text-sm">
                {L("నా Slots", "मेरे स्लॉट", "My Slots")}
              </h3>
              {millerSlots.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="p-6 text-center">
                    <Clock
                      size={32}
                      className="mx-auto text-muted-foreground mb-2"
                    />
                    <p className="text-sm text-muted-foreground">
                      {L(
                        "ఇంకా slots లేవు",
                        "अभी कोई स्लॉट नहीं",
                        "No slots yet",
                      )}
                    </p>
                  </CardContent>
                </Card>
              )}
              {millerSlots.map((slot) => (
                <Card key={slot.id} className="border-stone-200">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-bold text-sm">📅 {slot.date}</p>
                        <p className="text-xs text-muted-foreground">
                          🕐 {slot.timeStart} - {slot.timeEnd}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <Users size={10} className="inline mr-1" />
                          {slot.bookedCount}/{slot.totalCapacity}{" "}
                          {L("మంది", "लोग", "booked")}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setViewSlot(viewSlot?.id === slot.id ? null : slot)
                          }
                        >
                          {L("చూడు", "देखें", "View")}
                        </Button>
                        <button
                          onClick={() => deleteSlotMutation.mutate(slot.id)}
                          className="p-1.5 text-red-400 hover:text-red-600"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Slot Bookings List */}
                    {viewSlot?.id === slot.id && (
                      <div className="mt-3 border-t pt-3 space-y-2">
                        <p className="text-xs font-bold">
                          {L(
                            "Bookings List:",
                            "बुकिंग सूची:",
                            "Bookings List:",
                          )}
                        </p>
                        {slotBookings.length === 0 && (
                          <p className="text-xs text-muted-foreground">
                            {L(
                              "ఇంకా bookings లేవు",
                              "अभी कोई बुकिंग नहीं",
                              "No bookings yet",
                            )}
                          </p>
                        )}
                        {slotBookings.map((b) => (
                          <div
                            key={b.id}
                            className="flex items-center justify-between bg-stone-50 dark:bg-stone-900/30 rounded-lg p-2"
                          >
                            <div>
                              <p className="text-xs font-bold">
                                #{b.tokenNumber} {b.farmerName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {b.village} | {b.quantity} qtl
                              </p>
                              <a
                                href={`tel:${b.farmerPhone}`}
                                className="text-xs text-blue-600"
                              >
                                📞 {b.farmerPhone}
                              </a>
                            </div>
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              {L("Confirmed", "कन्फर्म", "Confirmed")}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════ BOOKING MODAL ══════════ */}
      {selectedSlot && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-background w-full rounded-t-2xl p-4 space-y-3 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold">{selectedSlot.millName}</h3>
                <p className="text-xs text-muted-foreground">
                  📅 {selectedSlot.date} | 🕐 {selectedSlot.timeStart} -{" "}
                  {selectedSlot.timeEnd}
                </p>
              </div>
              <button onClick={() => setSelectedSlot(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-2 text-center">
              <p className="text-sm font-bold text-green-700">
                {selectedSlot.totalCapacity - selectedSlot.bookedCount}{" "}
                {L("స్లాట్లు మిగిలాయి", "स्लॉट बचे", "slots remaining")}
              </p>
            </div>

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
                  placeholder={L("పేరు", "नाम", "Name")}
                />
              </div>
              <div>
                <label className="text-xs font-medium">
                  {L("Phone", "फोन", "Phone")} *
                </label>
                <Input
                  value={bookForm.farmerPhone}
                  onChange={(e) =>
                    setBookForm((p) => ({ ...p, farmerPhone: e.target.value }))
                  }
                  className="mt-1"
                  type="tel"
                  placeholder="9876543210"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium">
                  {L("గ్రామం", "गांव", "Village")} *
                </label>
                <Input
                  value={bookForm.village}
                  onChange={(e) =>
                    setBookForm((p) => ({ ...p, village: e.target.value }))
                  }
                  className="mt-1"
                  placeholder={L("మీ గ్రామం", "आपका गांव", "Your village")}
                />
              </div>
              <div>
                <label className="text-xs font-medium">
                  {L(
                    "Paddy పరిమాణం (quintals)",
                    "मात्रा (क्विंटल)",
                    "Quantity (quintals)",
                  )}{" "}
                  *
                </label>
                <Input
                  value={bookForm.quantity}
                  onChange={(e) =>
                    setBookForm((p) => ({ ...p, quantity: e.target.value }))
                  }
                  className="mt-1"
                  type="number"
                  placeholder="10"
                />
              </div>
            </div>

            <Button
              onClick={() => {
                if (
                  !bookForm.farmerName ||
                  !bookForm.farmerPhone ||
                  !bookForm.village ||
                  !bookForm.quantity
                ) {
                  alert(
                    L(
                      "అన్ని fields fill చేయండి",
                      "सभी fields भरें",
                      "Fill all fields",
                    ),
                  );
                  return;
                }
                bookMutation.mutate();
              }}
              disabled={bookMutation.isPending}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {bookMutation.isPending ? (
                <Loader2 className="animate-spin mr-2" size={16} />
              ) : (
                <Ticket size={16} className="mr-2" />
              )}
              {L("Slot Confirm చేయండి", "स्लॉट कन्फर्म करें", "Confirm Slot")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
