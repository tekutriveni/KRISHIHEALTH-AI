import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Factory,
  Clock,
  Users,
  Ticket,
  Loader2,
  X,
  CheckCircle2,
  LogIn,
  Plus,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { Language } from "@/lib/language";

interface Mill {
  id: number;
  ownerName: string;
  phone: string;
  millName: string;
  location: string;
  district: string;
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
interface Farmer {
  id: number;
  name: string;
  phone: string;
  village: string;
  cropType: string;
  quantity: string;
  quantityUnit: string;
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

export default function MillBook({ language }: { language: Language }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const L = (te: string, hi: string, en: string) =>
    language === "te" ? te : language === "hi" ? hi : en;

  const [tab, setTab] = useState<"farmer" | "miller">("farmer");
  const [farmer, setFarmer] = useState<Farmer | null>(() => {
    const s = localStorage.getItem("krishihealth_farmer");
    return s ? JSON.parse(s) : null;
  });
  const [farmerStep, setFarmerStep] = useState<"login" | "home">(
    farmer ? "home" : "login",
  );

  // ── Registration form (with quantityUnit + password) ──
  const [regForm, setRegForm] = useState({
    name: "",
    phone: "",
    village: "",
    cropType: "Rice",
    quantity: "",
    quantityUnit: "quintal",
    password: "",
  });

  // ── Login state (with password) ──
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [selectedSlot, setSelectedSlot] = useState<MillSlot | null>(null);
  const [bookingQuantity, setBookingQuantity] = useState("");
  const [bookedTicket, setBookedTicket] = useState<MillBooking | null>(null);

  const [miller, setMiller] = useState<Mill | null>(() => {
    const s = localStorage.getItem("krishihealth_miller");
    return s ? JSON.parse(s) : null;
  });
  const [millerTab, setMillerTab] = useState<"login" | "register">("login");
  const [loginForm, setLoginForm] = useState({ phone: "", password: "" });
  const [regMillForm, setRegMillForm] = useState({
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

  const { data: allSlots = [] } = useQuery<MillSlot[]>({
    queryKey: ["/api/slots"],
  });
  const { data: millerSlots = [] } = useQuery<MillSlot[]>({
    queryKey: [`/api/mills/${miller?.id}/slots`],
    enabled: !!miller,
  });
  const { data: farmerBookings = [] } = useQuery<MillBooking[]>({
    queryKey: [`/api/mill-bookings/farmer/${farmer?.phone}`],
    enabled: !!farmer,
  });
  const { data: slotBookings = [] } = useQuery<MillBooking[]>({
    queryKey: [`/api/slots/${viewSlot?.id}/bookings`],
    enabled: !!viewSlot,
  });

  // ── Register Farmer ──
  const registerFarmerMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/farmer/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      setFarmer(data.farmer);
      localStorage.setItem("krishihealth_farmer", JSON.stringify(data.farmer));
      setFarmerStep("home");
      qc.invalidateQueries({
        queryKey: [`/api/mill-bookings/farmer/${data.farmer.phone}`],
      });
      toast({
        title: L(
          "✅ నమోదు విజయవంతం!",
          "✅ पंजीकरण सफल!",
          "✅ Registered Successfully!",
        ),
        description: L(
          `స్వాగతం ${data.farmer.name}!`,
          `स्वागत ${data.farmer.name}!`,
          `Welcome ${data.farmer.name}!`,
        ),
      });
    },
    onError: (e: any) => alert(e.message),
  });

  // ── Login Farmer (with password) ──
  const loginFarmerMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/farmer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: loginPhone, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      setFarmer(data.farmer);
      localStorage.setItem("krishihealth_farmer", JSON.stringify(data.farmer));
      setFarmerStep("home");
      qc.invalidateQueries({
        queryKey: [`/api/mill-bookings/farmer/${data.farmer.phone}`],
      });
      toast({
        title: L("✅ Login విజయవంతం!", "✅ लॉगिन सफल!", "✅ Login Successful!"),
        description: L(
          `స్వాగతం ${data.farmer.name}!`,
          `स्वागत ${data.farmer.name}!`,
          `Welcome back ${data.farmer.name}!`,
        ),
      });
    },
    onError: (e: any) => alert(e.message),
  });

  // ── Book Slot ──
  const bookMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/slots/${selectedSlot!.id}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          farmerName: farmer!.name,
          farmerPhone: farmer!.phone,
          village: farmer!.village,
          quantity: bookingQuantity || farmer!.quantity,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking failed");
      return data;
    },
    onSuccess: (data) => {
      setBookedTicket(data.booking);
      setSelectedSlot(null);
      setBookingQuantity("");
      qc.invalidateQueries({ queryKey: ["/api/slots"] });
      qc.invalidateQueries({
        queryKey: [`/api/mill-bookings/farmer/${farmer?.phone}`],
      });
      toast({
        title: L(
          "🎉 Booking Confirmed!",
          "🎉 बुकिंग कन्फर्म!",
          "🎉 Booking Confirmed!",
        ),
        description: `Token #${data.tokenNumber} | ${data.booking.millName} | ${data.booking.timeStart}-${data.booking.timeEnd}`,
      });
    },
    onError: (e: any) => alert(e.message),
  });

  // ── Miller Login ──
  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/mills/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      setMiller(data.mill);
      localStorage.setItem("krishihealth_miller", JSON.stringify(data.mill));
      toast({
        title: L("✅ Login విజయవంతం!", "✅ लॉगिन सफल!", "✅ Login Successful!"),
        description: data.mill.millName,
      });
    },
    onError: () =>
      alert(
        L("Phone లేదా Password తప్పు!", "गलत!", "Wrong phone or password!"),
      ),
  });

  // ── Mill Register ──
  const registerMillMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/mills/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regMillForm),
      });
      return res.json();
    },
    onSuccess: (data) => {
      setMiller(data.mill);
      localStorage.setItem("krishihealth_miller", JSON.stringify(data.mill));
      toast({
        title: L(
          "✅ Mill Register అయింది!",
          "✅ मिल रजिस्टर!",
          "✅ Mill Registered!",
        ),
        description: data.mill.millName,
      });
    },
  });

  // ── Create Slot ──
  const createSlotMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/mills/${miller!.id}/slots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...slotForm,
          millName: miller!.millName,
          totalCapacity: Number(slotForm.totalCapacity),
        }),
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [`/api/mills/${miller?.id}/slots`] });
      qc.invalidateQueries({ queryKey: ["/api/slots"] });
      setShowSlotForm(false);
      setSlotForm({
        date: "",
        timeStart: "8:00 AM",
        timeEnd: "9:00 AM",
        totalCapacity: "10",
        pricePerQuintal: "0",
      });
      toast({
        title: L(
          "✅ Slot Create అయింది!",
          "✅ स्लॉट बनाया!",
          "✅ Slot Created!",
        ),
      });
    },
  });

  const deleteSlotMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/slots/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [`/api/mills/${miller?.id}/slots`] });
      qc.invalidateQueries({ queryKey: ["/api/slots"] });
    },
  });

  const CROPS =
    language === "te"
      ? ["వరి", "గోధుమ", "పత్తి", "మొక్కజొన్న", "మిరప", "సోయాబీన్", "వేరుశనగ"]
      : language === "hi"
        ? ["चावल", "गेहूं", "कपास", "मक्का", "मिर्च", "सोयाबीन", "मूंगफली"]
        : [
            "Rice",
            "Wheat",
            "Cotton",
            "Maize",
            "Chilli",
            "Soybean",
            "Groundnut",
          ];

  const available = allSlots.filter((s) => s.bookedCount < s.totalCapacity);
  const full = allSlots.filter((s) => s.bookedCount >= s.totalCapacity);

  return (
    <div className="space-y-4 pb-8">
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
            "लाइन में खड़े न हों",
            "No waiting — go at your booked time",
          )}
        </p>
      </div>

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

      {/* ══ FARMER TAB ══ */}
      {tab === "farmer" && (
        <div className="space-y-4">
          {farmerStep === "login" && (
            <Card>
              <CardContent className="pt-4 space-y-3">
                <h3 className="font-bold text-sm">
                  {L("రైతు నమోదు", "किसान पंजीकरण", "Farmer Registration")}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {L(
                    "మీ పంట వివరాలతో నమోదు చేయండి",
                    "फसल विवरण के साथ पंजीकरण करें",
                    "Register with your crop details",
                  )}
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium">
                      {L("పేరు", "नाम", "Name")} *
                    </label>
                    <Input
                      value={regForm.name}
                      onChange={(e) =>
                        setRegForm((p) => ({ ...p, name: e.target.value }))
                      }
                      className="mt-1"
                      placeholder={L("మీ పేరు", "आपका नाम", "Your name")}
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
                      type="tel"
                      placeholder="9876543210"
                      maxLength={10}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium">
                    {L("గ్రామం", "गांव", "Village")}
                  </label>
                  <Input
                    value={regForm.village}
                    onChange={(e) =>
                      setRegForm((p) => ({ ...p, village: e.target.value }))
                    }
                    className="mt-1"
                    placeholder={L("మీ గ్రామం", "आपका गांव", "Your village")}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium">
                    {L("పంట రకం", "फसल", "Crop Type")} *
                  </label>
                  <select
                    className="w-full mt-1 border rounded-lg p-2 text-sm bg-background"
                    value={regForm.cropType}
                    onChange={(e) =>
                      setRegForm((p) => ({ ...p, cropType: e.target.value }))
                    }
                  >
                    {CROPS.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Quantity + Unit */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium">
                      {L("పరిమాణం", "मात्रा", "Quantity")} *
                    </label>
                    <Input
                      value={regForm.quantity}
                      onChange={(e) =>
                        setRegForm((p) => ({ ...p, quantity: e.target.value }))
                      }
                      className="mt-1"
                      type="number"
                      placeholder="10"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium">
                      {L("యూనిట్", "इकाई", "Unit")}
                    </label>
                    <select
                      className="w-full mt-1 border rounded-lg p-2 text-sm bg-background"
                      value={regForm.quantityUnit}
                      onChange={(e) =>
                        setRegForm((p) => ({
                          ...p,
                          quantityUnit: e.target.value,
                        }))
                      }
                    >
                      <option value="quintal">
                        {L("క్వింటల్", "क्विंटल", "Quintal")}
                      </option>
                      <option value="kg">KG</option>
                      <option value="ton">{L("టన్", "टन", "Ton")}</option>
                    </select>
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="text-xs font-medium">
                    {L("Password", "पासवर्ड", "Password")} *
                  </label>
                  <Input
                    value={regForm.password}
                    onChange={(e) =>
                      setRegForm((p) => ({ ...p, password: e.target.value }))
                    }
                    className="mt-1"
                    type="password"
                    placeholder="••••••"
                  />
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {L(
                      "తర్వాత login కి ఇదే password use చేయండి",
                      "बाद में login के लिए यही password use करें",
                      "Use this password to login next time",
                    )}
                  </p>
                </div>

                <Button
                  onClick={() => {
                    if (
                      !regForm.name ||
                      !regForm.phone ||
                      !regForm.cropType ||
                      !regForm.quantity ||
                      !regForm.password
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
                    if (regForm.phone.length !== 10) {
                      alert(
                        L(
                          "10 digit phone enter చేయండి",
                          "10 अंक दर्ज करें",
                          "Enter 10 digit phone",
                        ),
                      );
                      return;
                    }
                    registerFarmerMutation.mutate();
                  }}
                  disabled={registerFarmerMutation.isPending}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  {registerFarmerMutation.isPending ? (
                    <Loader2 className="animate-spin mr-2" size={16} />
                  ) : (
                    <CheckCircle2 size={16} className="mr-2" />
                  )}
                  {L(
                    "Register & Continue",
                    "रजिस्टर करें",
                    "Register & Continue",
                  )}
                </Button>

                {/* Login section */}
                <div className="border-t pt-3">
                  <p className="text-xs font-bold text-center mb-2">
                    {L(
                      "Already registered? Login చేయండి",
                      "Already registered? Login करें",
                      "Already registered? Login",
                    )}
                  </p>
                  <div className="space-y-2">
                    <Input
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value)}
                      placeholder={L("Phone నంబర్", "फोन नंबर", "Phone number")}
                      type="tel"
                      maxLength={10}
                    />
                    <Input
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder={L("Password", "पासवर्ड", "Password")}
                      type="password"
                    />
                    <Button
                      onClick={() => {
                        if (loginPhone.length !== 10) {
                          alert(
                            L(
                              "10 digit phone enter చేయండి",
                              "10 अंक दर्ज करें",
                              "Enter 10 digits",
                            ),
                          );
                          return;
                        }
                        if (!loginPassword) {
                          alert(
                            L(
                              "Password enter చేయండి",
                              "पासवर्ड दर्ज करें",
                              "Enter password",
                            ),
                          );
                          return;
                        }
                        loginFarmerMutation.mutate();
                      }}
                      disabled={loginFarmerMutation.isPending}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      {loginFarmerMutation.isPending ? (
                        <Loader2 className="animate-spin mr-2" size={14} />
                      ) : (
                        <LogIn size={14} className="mr-2" />
                      )}
                      {L("Login", "लॉगिन", "Login")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {farmerStep === "home" && farmer && (
            <>
              {/* Farmer Info Card — with quantityUnit */}
              <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm">👨‍🌾 {farmer.name}</p>
                    <p className="text-xs text-muted-foreground">
                      🌾 {farmer.cropType} • {farmer.quantity}{" "}
                      {farmer.quantityUnit} • {farmer.village}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      localStorage.removeItem("krishihealth_farmer");
                      setFarmer(null);
                      setFarmerStep("login");
                    }}
                    className="text-xs text-red-500 underline"
                  >
                    {L("Logout", "लॉगआउट", "Logout")}
                  </button>
                </CardContent>
              </Card>

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
                        {L("మీ టోకెన్ నంబర్", "आपका टोकन", "Your Token")}
                      </p>
                      <div className="border-t pt-2 space-y-1">
                        <p className="text-sm font-bold">
                          {bookedTicket.millName}
                        </p>
                        <p className="text-sm">📅 {bookedTicket.date}</p>
                        <p className="text-sm">
                          🕐 {bookedTicket.timeStart} - {bookedTicket.timeEnd}
                        </p>
                        <p className="text-sm">
                          🌾 {bookedTicket.quantity}{" "}
                          {L("క్వింటాళ్లు", "क्विंटल", "quintals")}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => setBookedTicket(null)}
                      variant="outline"
                      className="w-full mt-3"
                    >
                      {L(
                        "మరొక Slot చూడండి",
                        "और स्लॉट देखें",
                        "View More Slots",
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {farmerBookings.length > 0 && (
                <div>
                  <h3 className="font-bold text-sm mb-2">
                    {L("నా Bookings", "मेरी बुकिंग", "My Bookings")}
                  </h3>
                  {farmerBookings.map((b) => (
                    <Card key={b.id} className="mb-2 border-green-100">
                      <CardContent className="p-3 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-sm">{b.millName}</p>
                          <p className="text-xs text-muted-foreground">
                            📅 {b.date} | 🕐 {b.timeStart}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            🌾 {b.quantity} {L("క్వింటాళ్లు", "क्विंटल", "qtl")}
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
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <div>
                <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
                  <Ticket size={16} className="text-green-600" />
                  {L(
                    "అందుబాటులో ఉన్న Slots",
                    "उपलब्ध स्लॉट",
                    "Available Slots",
                  )}{" "}
                  ({available.length})
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
                {available.map((slot) => {
                  const pct = Math.round(
                    (slot.bookedCount / slot.totalCapacity) * 100,
                  );
                  const remaining = slot.totalCapacity - slot.bookedCount;
                  return (
                    <Card
                      key={slot.id}
                      className="mb-3 border-green-100 hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-bold text-sm">
                              🏭 {slot.millName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              📅 {slot.date} | 🕐 {slot.timeStart} -{" "}
                              {slot.timeEnd}
                            </p>
                            <div className="mt-2">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-green-600 font-medium">
                                  {remaining}{" "}
                                  {L("మిగిలాయి", "बचे", "remaining")}
                                </span>
                                <span className="text-muted-foreground">
                                  {slot.bookedCount}/{slot.totalCapacity}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${pct > 70 ? "bg-red-500" : pct > 40 ? "bg-yellow-500" : "bg-green-500"}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          </div>
                          <Button
                            onClick={() => setSelectedSlot(slot)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white shrink-0"
                          >
                            {L("Book", "बुक", "Book")}{" "}
                            <ChevronRight size={14} />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {full.length > 0 && (
                <div>
                  <h3 className="font-bold text-sm mb-2 text-red-600">
                    {L("Full అయిన Slots", "भरे हुए स्लॉट", "Full Slots")}
                  </h3>
                  {full.map((slot) => (
                    <Card
                      key={slot.id}
                      className="mb-2 border-red-100 opacity-60"
                    >
                      <CardContent className="p-3 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-sm">{slot.millName}</p>
                          <p className="text-xs text-muted-foreground">
                            📅 {slot.date} | 🕐 {slot.timeStart}
                          </p>
                        </div>
                        <Badge className="bg-red-100 text-red-800">
                          {L("Full", "भरा", "Full")}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ══ MILLER TAB ══ */}
      {tab === "miller" && (
        <div className="space-y-4">
          {!miller && (
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
                      onClick={() => loginMutation.mutate()}
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
                          {L("పేరు", "नाम", "Name")} *
                        </label>
                        <Input
                          value={regMillForm.ownerName}
                          onChange={(e) =>
                            setRegMillForm((p) => ({
                              ...p,
                              ownerName: e.target.value,
                            }))
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium">
                          {L("Phone", "फोन", "Phone")} *
                        </label>
                        <Input
                          value={regMillForm.phone}
                          onChange={(e) =>
                            setRegMillForm((p) => ({
                              ...p,
                              phone: e.target.value,
                            }))
                          }
                          className="mt-1"
                          type="tel"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium">
                        {L("Mill పేరు", "मिल नाम", "Mill Name")} *
                      </label>
                      <Input
                        value={regMillForm.millName}
                        onChange={(e) =>
                          setRegMillForm((p) => ({
                            ...p,
                            millName: e.target.value,
                          }))
                        }
                        className="mt-1"
                        placeholder="Sri Lakshmi Rice Mill"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-medium">
                          {L("స్థలం", "स्थान", "Location")} *
                        </label>
                        <Input
                          value={regMillForm.location}
                          onChange={(e) =>
                            setRegMillForm((p) => ({
                              ...p,
                              location: e.target.value,
                            }))
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium">
                          {L("జిల్లా", "जिला", "District")} *
                        </label>
                        <Input
                          value={regMillForm.district}
                          onChange={(e) =>
                            setRegMillForm((p) => ({
                              ...p,
                              district: e.target.value,
                            }))
                          }
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-medium">
                          {L("Capacity", "क्षमता", "Capacity")}
                        </label>
                        <Input
                          value={regMillForm.capacity}
                          onChange={(e) =>
                            setRegMillForm((p) => ({
                              ...p,
                              capacity: e.target.value,
                            }))
                          }
                          className="mt-1"
                          type="number"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium">
                          {L("Password", "पासवर्ड", "Password")} *
                        </label>
                        <Input
                          value={regMillForm.password}
                          onChange={(e) =>
                            setRegMillForm((p) => ({
                              ...p,
                              password: e.target.value,
                            }))
                          }
                          className="mt-1"
                          type="password"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        if (
                          !regMillForm.ownerName ||
                          !regMillForm.phone ||
                          !regMillForm.millName ||
                          !regMillForm.location ||
                          !regMillForm.district ||
                          !regMillForm.password
                        ) {
                          alert(
                            L(
                              "Fill all required fields",
                              "सभी fields भरें",
                              "Fill all fields",
                            ),
                          );
                          return;
                        }
                        registerMillMutation.mutate();
                      }}
                      disabled={registerMillMutation.isPending}
                      className="w-full bg-stone-700 hover:bg-stone-800 text-white"
                    >
                      {registerMillMutation.isPending ? (
                        <Loader2 className="animate-spin mr-2" size={16} />
                      ) : (
                        <Plus size={16} className="mr-2" />
                      )}
                      {L("Register చేయండి", "रजिस्टर करें", "Register")}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {miller && (
            <div className="space-y-4">
              <Card className="border-stone-200 bg-stone-50 dark:bg-stone-950/20">
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <p className="font-bold">🏭 {miller.millName}</p>
                    <p className="text-xs text-muted-foreground">
                      {miller.location}, {miller.district}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      localStorage.removeItem("krishihealth_miller");
                      setMiller(null);
                      setMillerTab("login");
                    }}
                  >
                    {L("Logout", "लॉगआउट", "Logout")}
                  </Button>
                </CardContent>
              </Card>

              {!showSlotForm && (
                <Button
                  onClick={() => setShowSlotForm(true)}
                  className="w-full bg-stone-700 hover:bg-stone-800 text-white gap-2"
                >
                  <Plus size={18} />{" "}
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
                          Start Time
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
                        <label className="text-xs font-medium">End Time</label>
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
                          {L("Max Farmers", "अधिकतम किसान", "Max Farmers")}
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
                          {L("ధర ₹/క్వింటాల్", "कीमत ₹/क्विंटल", "Price ₹/qtl")}
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
                        createSlotMutation.mutate();
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
                        <p className="font-bold text-sm">🗓️ {slot.date}</p>
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
                              ✓
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

      {/* ══ BOOKING MODAL ══ */}
      {selectedSlot && farmer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-background w-full rounded-t-2xl p-4 space-y-3 max-h-[80vh] overflow-y-auto">
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
            <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3">
              <p className="text-sm font-bold text-green-700">
                {selectedSlot.totalCapacity - selectedSlot.bookedCount}{" "}
                {L("స్లాట్లు మిగిలాయి", "स्लॉट बचे", "slots remaining")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {L("మీ Token నంబర్:", "आपका टोकन:", "Your Token:")} #
                {selectedSlot.bookedCount + 1}
              </p>
            </div>
            <div className="bg-stone-50 dark:bg-stone-900/30 rounded-lg p-3 space-y-1">
              <p className="text-xs font-bold">
                {L("మీ వివరాలు:", "आपकी जानकारी:", "Your Details:")}
              </p>
              <p className="text-sm">👨‍🌾 {farmer.name}</p>
              <p className="text-sm">🌾 {farmer.cropType}</p>
              <p className="text-sm">📍 {farmer.village}</p>
            </div>
            <div>
              <label className="text-xs font-medium">
                {L(
                  "పంపించే పరిమాణం (క్వింటాళ్లు)",
                  "भेजने की मात्रा (क्विंटल)",
                  "Quantity to send (qtl)",
                )}{" "}
                *
              </label>
              <Input
                value={bookingQuantity}
                onChange={(e) => setBookingQuantity(e.target.value)}
                className="mt-1"
                type="number"
                placeholder={farmer.quantity}
              />
            </div>
            <Button
              onClick={() => {
                if (!bookingQuantity) {
                  alert(
                    L(
                      "పరిమాణం enter చేయండి",
                      "मात्रा दर्ज करें",
                      "Enter quantity",
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
