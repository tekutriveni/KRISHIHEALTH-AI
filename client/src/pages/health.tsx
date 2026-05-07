import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  HeartPulse,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronLeft,
  Camera,
  Bandage,
  Phone,
  AlertCircle,
  Leaf,
  Pill,
  Send,
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

interface HealthProps {
  language: Language;
}

const MORNING_QUESTIONS = {
  en: [
    {
      key: "sleep",
      question: "Did you sleep well last night?",
      options: ["Yes, very well", "Ok, average", "No, poor sleep"],
    },
    {
      key: "energy",
      question: "Do you feel tired or energetic today?",
      options: ["Very energetic", "Normal", "Very tired"],
    },
    {
      key: "breakfast",
      question: "Did you eat proper breakfast today?",
      options: ["Yes, full breakfast", "Light snack only", "No breakfast"],
    },
    {
      key: "pain",
      question: "Do you have any body pain today?",
      options: ["No pain", "Yes, mild", "Yes, severe"],
    },
    {
      key: "stress",
      question: "What is your stress level today? (1=low, 10=high)",
      options: ["1-3 Low", "4-6 Medium", "7-10 High"],
    },
    {
      key: "family",
      question: "Are your family members healthy today?",
      options: ["Yes, all fine", "Someone is unwell", "Need doctor"],
    },
  ],
  te: [
    {
      key: "sleep",
      question: "నిన్న రాత్రి నిద్ర బాగా పట్టిందా?",
      options: ["అవును, చాలా బాగా", "సాధారణంగా", "లేదు, సరిగా పట్టలేదు"],
    },
    {
      key: "energy",
      question: "ఈ రోజు అలసటగా ఉందా లేదా ఉత్సాహంగా ఉందా?",
      options: ["చాలా ఉత్సాహంగా", "సాధారణంగా", "చాలా అలసటగా"],
    },
    {
      key: "breakfast",
      question: "ఈ రోజు అల్పాహారం సరిగ్గా తిన్నారా?",
      options: ["అవును, పూర్తిగా", "కొంచెం మాత్రమే", "తినలేదు"],
    },
    {
      key: "pain",
      question: "ఈ రోజు శరీరంలో ఏదైనా నొప్పిగా ఉందా?",
      options: ["నొప్పి లేదు", "అవును, కొంచెం", "అవును, చాలా"],
    },
    {
      key: "stress",
      question: "ఈ రోజు మీ మానసిక ఒత్తిడి 1 నుండి 10 లో ఎంత?",
      options: ["1-3 తక్కువ", "4-6 మధ్యస్థం", "7-10 ఎక్కువ"],
    },
    {
      key: "family",
      question: "మీ కుటుంబ సభ్యులు అందరూ ఆరోగ్యంగా ఉన్నారా?",
      options: ["అవును, అందరూ బాగున్నారు", "ఒకరికి అనారోగ్యం", "డాక్టర్ అవసరం"],
    },
  ],
  hi: [
    {
      key: "sleep",
      question: "क्या कल रात नींद अच्छी आई?",
      options: ["हाँ, बहुत अच्छी", "ठीक थी", "नहीं, खराब नींद"],
    },
    {
      key: "energy",
      question: "क्या आज थका हुआ महसूस हो रहे हैं या ऊर्जावान?",
      options: ["बहुत ऊर्जावान", "सामान्य", "बहुत थका हुआ"],
    },
    {
      key: "breakfast",
      question: "क्या आज सुबह का नाश्ता ठीक से किया?",
      options: ["हाँ, पूरा नाश्ता", "थोड़ा ही खाया", "नहीं खाया"],
    },
    {
      key: "pain",
      question: "क्या आज शरीर में कोई दर्द है?",
      options: ["कोई दर्द नहीं", "हाँ, हल्का", "हाँ, तेज़"],
    },
    {
      key: "stress",
      question: "आज का तनाव स्तर 1 से 10 में कितना है?",
      options: ["1-3 कम", "4-6 मध्यम", "7-10 अधिक"],
    },
    {
      key: "family",
      question: "क्या परिवार के सभी सदस्य आज स्वस्थ हैं?",
      options: ["हाँ, सब ठीक हैं", "कोई बीमार है", "डॉक्टर जरूरी"],
    },
  ],
};

const NOON_QUESTIONS = {
  en: [
    {
      key: "water",
      question: "Did you drink enough water today? (At least 3 liters)",
      options: ["Yes, plenty", "Some, not enough", "Very little"],
    },
    {
      key: "dizzy",
      question: "Do you feel dizzy or have headache?",
      options: ["No, fine", "Mild headache", "Severe dizziness"],
    },
    {
      key: "pesticide",
      question: "Did you spray pesticides today?",
      options: ["No", "Yes, with protection", "Yes, without mask"],
    },
    {
      key: "sun",
      question: "How many hours did you work in sun today?",
      options: ["Less than 2 hours", "2-4 hours", "More than 4 hours"],
    },
    {
      key: "chest",
      question: "Do you feel chest pain or breathing problem?",
      options: ["No problem", "Mild discomfort", "Yes, difficulty breathing"],
    },
    {
      key: "lunch",
      question: "Did you eat proper lunch today?",
      options: ["Yes, full meal", "Light snack", "Not yet"],
    },
  ],
  te: [
    {
      key: "water",
      question: "ఈ రోజు తగినంత నీళ్ళు తాగారా? (కనీసం 3 లీటర్లు)",
      options: ["అవును, చాలా తాగాను", "కొంచెం తాగాను", "చాలా తక్కువ"],
    },
    {
      key: "dizzy",
      question: "తల తిరుగుతుందా లేదా తలనొప్పి ఉందా?",
      options: ["లేదు, బాగున్నాను", "కొంచెం తలనొప్పి", "చాలా తలతిరుగుతోంది"],
    },
    {
      key: "pesticide",
      question: "ఈ రోజు పురుగుమందు పిచికారీ చేశారా?",
      options: ["లేదు", "అవును, రక్షణతో", "అవును, మాస్క్ లేకుండా"],
    },
    {
      key: "sun",
      question: "ఈ రోజు ఎండలో ఎన్ని గంటలు పని చేశారు?",
      options: ["2 గంటల కంటే తక్కువ", "2-4 గంటలు", "4 గంటల కంటే ఎక్కువ"],
    },
    {
      key: "chest",
      question: "గుండె నొప్పి లేదా శ్వాస తీసుకోవడంలో ఇబ్బందిగా ఉందా?",
      options: ["సమస్య లేదు", "కొంచెం అసౌకర్యం", "అవును, శ్వాస ఇబ్బంది"],
    },
    {
      key: "lunch",
      question: "ఈ రోజు మధ్యాహ్నం భోజనం సరిగ్గా చేశారా?",
      options: ["అవును, పూర్తి భోజనం", "తేలికగా తిన్నాను", "ఇంకా తినలేదు"],
    },
  ],
  hi: [
    {
      key: "water",
      question: "क्या आज पर्याप्त पानी पिया? (कम से कम 3 लीटर)",
      options: ["हाँ, काफी पिया", "थोड़ा पिया", "बहुत कम"],
    },
    {
      key: "dizzy",
      question: "क्या चक्कर आ रहे हैं या सिरदर्द है?",
      options: ["नहीं, ठीक हूँ", "हल्का सिरदर्द", "तेज़ चक्कर"],
    },
    {
      key: "pesticide",
      question: "क्या आज कीटनाशक का छिड़काव किया?",
      options: ["नहीं", "हाँ, सुरक्षा के साथ", "हाँ, बिना मास्क के"],
    },
    {
      key: "sun",
      question: "आज धूप में कितने घंटे काम किया?",
      options: ["2 घंटे से कम", "2-4 घंटे", "4 घंटे से अधिक"],
    },
    {
      key: "chest",
      question: "क्या सीने में दर्द या सांस लेने में तकलीफ है?",
      options: ["कोई समस्या नहीं", "हल्की तकलीफ", "हाँ, सांस में दिक्कत"],
    },
    {
      key: "lunch",
      question: "क्या आज दोपहर का खाना ठीक से खाया?",
      options: ["हाँ, पूरा खाना", "हल्का खाया", "अभी नहीं खाया"],
    },
  ],
};

const EVENING_QUESTIONS = {
  en: [
    {
      key: "energy",
      question: "How was your overall energy level today?",
      options: ["Good, felt strong", "Average", "Very low, exhausted"],
    },
    {
      key: "meals",
      question: "Did you eat proper lunch and dinner today?",
      options: ["Yes, both meals", "Only one meal", "Skipped meals"],
    },
    {
      key: "skin",
      question: "Any skin irritation or eye problem today?",
      options: ["No problem", "Minor irritation", "Needs treatment"],
    },
    {
      key: "crop",
      question: "How is your crop looking today?",
      options: [
        "Healthy, growing well",
        "Some issues noticed",
        "Serious problem",
      ],
    },
    {
      key: "mental",
      question: "Did you feel mentally stressed today?",
      options: ["No, relaxed", "A little stressed", "Very stressed"],
    },
    {
      key: "doctor",
      question: "Do you feel you need to see a doctor?",
      options: ["No, I'm fine", "Maybe tomorrow", "Yes, urgently"],
    },
  ],
  te: [
    {
      key: "energy",
      question: "ఈ రోజు మొత్తం మీద శక్తి స్థాయి ఎలా ఉంది?",
      options: [
        "బాగుంది, శక్తిగా అనిపించింది",
        "సాధారణంగా",
        "చాలా తక్కువ, అలసిపోయాను",
      ],
    },
    {
      key: "meals",
      question: "మధ్యాహ్నం మరియు రాత్రి భోజనం సరిగ్గా చేశారా?",
      options: ["అవును, రెండూ తిన్నాను", "ఒక్క పూట మాత్రమే", "తినలేదు"],
    },
    {
      key: "skin",
      question: "చర్మం మంటగా ఉందా లేదా కళ్ళు మండుతున్నాయా?",
      options: ["సమస్య లేదు", "కొంచెం మంట", "చికిత్స అవసరం"],
    },
    {
      key: "crop",
      question: "ఈ రోజు మీ పంట ఎలా ఉంది?",
      options: [
        "ఆరోగ్యంగా పెరుగుతోంది",
        "కొన్ని సమస్యలు కనిపించాయి",
        "తీవ్రమైన సమస్య",
      ],
    },
    {
      key: "mental",
      question: "ఈ రోజు మానసికంగా ఒత్తిడిగా అనిపించిందా?",
      options: ["లేదు, రిలాక్స్‌గా ఉన్నాను", "కొంచెం ఒత్తిడి", "చాలా ఒత్తిడి"],
    },
    {
      key: "doctor",
      question: "డాక్టర్ దగ్గరకు వెళ్ళాల్సిన అవసరం ఉందా?",
      options: ["లేదు, నేను బాగున్నాను", "రేపు వెళతాను", "అవును, అత్యవసరం"],
    },
  ],
  hi: [
    {
      key: "energy",
      question: "आज कुल मिलाकर ऊर्जा का स्तर कैसा था?",
      options: ["अच्छा, ताकत महसूस हुई", "सामान्य", "बहुत कम, थक गया"],
    },
    {
      key: "meals",
      question: "क्या आज दोपहर और रात का खाना ठीक से खाया?",
      options: ["हाँ, दोनों खाए", "सिर्फ एक बार", "खाना छोड़ा"],
    },
    {
      key: "skin",
      question: "क्या आज त्वचा में जलन या आंखों में समस्या हुई?",
      options: ["कोई समस्या नहीं", "हल्की जलन", "इलाज जरूरी"],
    },
    {
      key: "crop",
      question: "आज आपकी फसल कैसी दिख रही है?",
      options: [
        "स्वस्थ, अच्छी बढ़ रही है",
        "कुछ समस्याएं दिखीं",
        "गंभीर समस्या",
      ],
    },
    {
      key: "mental",
      question: "क्या आज मानसिक तनाव महसूस हुआ?",
      options: ["नहीं, आराम था", "थोड़ा तनाव", "बहुत तनाव"],
    },
    {
      key: "doctor",
      question: "क्या आपको डॉक्टर के पास जाने की जरूरत लग रही है?",
      options: ["नहीं, मैं ठीक हूँ", "शायद कल", "हाँ, जरूरी है"],
    },
  ],
};

const WEEKLY_QUESTIONS = {
  en: [
    {
      key: "income",
      question: "Did you earn enough money this week?",
      options: ["Yes, satisfied", "Average earnings", "No, very less"],
    },
    {
      key: "loan",
      question: "Do you have any loan stress this week?",
      options: ["No loan stress", "Some worry", "Very stressed about loans"],
    },
    {
      key: "doctor",
      question: "Did you visit a doctor this month?",
      options: ["Yes, regular checkup", "Only when sick", "No, not visited"],
    },
    {
      key: "children",
      question: "Are your children going to school regularly?",
      options: ["Yes, regularly", "Sometimes missing", "Not going"],
    },
    {
      key: "hope",
      question: "Do you feel hopeful about your farming future?",
      options: [
        "Yes, very hopeful",
        "Somewhat hopeful",
        "Worried about future",
      ],
    },
  ],
  te: [
    {
      key: "income",
      question: "ఈ వారం తగినంత ఆదాయం వచ్చిందా?",
      options: ["అవును, సంతోషంగా ఉన్నాను", "సగటు ఆదాయం", "లేదు, చాలా తక్కువ"],
    },
    {
      key: "loan",
      question: "ఈ వారం అప్పుల ఒత్తిడి ఉందా?",
      options: [
        "అప్పుల ఒత్తిడి లేదు",
        "కొంచెం ఆందోళన",
        "అప్పుల గురించి చాలా ఒత్తిడి",
      ],
    },
    {
      key: "doctor",
      question: "ఈ నెలలో డాక్టర్ దగ్గరకు వెళ్ళారా?",
      options: [
        "అవును, రెగ్యులర్ చెకప్",
        "అనారోగ్యం వచ్చినప్పుడే",
        "లేదు, వెళ్ళలేదు",
      ],
    },
    {
      key: "children",
      question: "మీ పిల్లలు పాఠశాలకు క్రమంగా వెళ్తున్నారా?",
      options: ["అవును, క్రమంగా", "కొన్నిసార్లు తప్పుతున్నారు", "వెళ్ళడం లేదు"],
    },
    {
      key: "hope",
      question: "మీ వ్యవసాయం భవిష్యత్తు గురించి ఆశగా అనిపిస్తుందా?",
      options: ["అవును, చాలా ఆశగా", "కొంచెం ఆశగా", "భవిష్యత్తు గురించి ఆందోళన"],
    },
  ],
  hi: [
    {
      key: "income",
      question: "क्या इस हफ्ते पर्याप्त कमाई हुई?",
      options: ["हाँ, संतुष्ट हूँ", "औसत कमाई", "नहीं, बहुत कम"],
    },
    {
      key: "loan",
      question: "क्या इस हफ्ते कर्ज का तनाव है?",
      options: ["कोई तनाव नहीं", "थोड़ी चिंता", "कर्ज से बहुत परेशान"],
    },
    {
      key: "doctor",
      question: "क्या इस महीने डॉक्टर के पास गए?",
      options: ["हाँ, नियमित जांच", "बीमार होने पर ही", "नहीं गया"],
    },
    {
      key: "children",
      question: "क्या बच्चे नियमित रूप से स्कूल जा रहे हैं?",
      options: ["हाँ, नियमित", "कभी-कभी नहीं जाते", "स्कूल नहीं जा रहे"],
    },
    {
      key: "hope",
      question: "क्या खेती के भविष्य के बारे में उम्मीद है?",
      options: ["हाँ, बहुत उम्मीद", "थोड़ी उम्मीद", "भविष्य की चिंता"],
    },
  ],
};

function getCurrentSession(): {
  type: "morning" | "noon" | "evening" | "weekly";
  label: string;
} {
  const now = new Date();
  const h = now.getHours();
  const day = now.getDay();
  if (day === 0 && h >= 18)
    return { type: "weekly", label: "Weekly Check (Sunday)" };
  if (h >= 7 && h < 12)
    return { type: "morning", label: "Morning Check (7 AM)" };
  if (h >= 12 && h < 18)
    return { type: "noon", label: "Field Work Check (12 PM)" };
  if (h >= 18) return { type: "evening", label: "Evening Check (6 PM)" };
  return { type: "morning", label: "Morning Check (7 AM)" };
}

function getQuestionsForSession(session: string, language: Language) {
  const lang = (["te", "hi"].includes(language) ? language : "en") as
    | "en"
    | "te"
    | "hi";
  switch (session) {
    case "morning":
      return MORNING_QUESTIONS[lang];
    case "noon":
      return NOON_QUESTIONS[lang];
    case "weekly":
      return WEEKLY_QUESTIONS[lang];
    default:
      return EVENING_QUESTIONS[lang];
  }
}

export default function Health({ language }: HealthProps) {
  const tx = useTranslation(language);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const {
    isListening,
    isSpeaking,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  } = useVoice(language);

  const [activeTab, setActiveTab] = useState<"checkin" | "injury">("checkin");
  const [step, setStep] = useState<"intro" | "questions" | "result">("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any>(null);

  // Injury state
  const [injuryImage, setInjuryImage] = useState<File | null>(null);
  const [injuryPreview, setInjuryPreview] = useState<string | null>(null);
  const [injuryResult, setInjuryResult] = useState<any>(null);
  const [farmerName, setFarmerName] = useState("");
  const [familyPhone, setFamilyPhone] = useState("");
  const [smsSending, setSmsSending] = useState(false);
  const [smsSent, setSmsSent] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const session = getCurrentSession();
  const questions = getQuestionsForSession(session.type, language);
  const sessionEmoji: Record<string, string> = {
    morning: "🌅",
    noon: "☀️",
    evening: "🌆",
    weekly: "📋", // 📅 బదులు 📋 వాడండి
  };

  function shareInjuryWhatsApp(name: string, res: any) {
    const severityLabel =
      res.severity === "critical"
        ? "🆘 CRITICAL"
        : res.severity === "severe"
          ? "🚨 Severe"
          : res.severity === "moderate"
            ? "⚠️ Moderate"
            : "✅ Mild";

    const msg =
      `🌾 *KrishiHealth AI — Injury Alert!*\n\n` +
      `👨‍🌾 *Farmer:* ${name || "Unknown"}\n` +
      `🩹 *Injury:* ${res.woundType || "Wound detected"}\n` +
      `⚠️ *Severity:* ${severityLabel}\n\n` +
      (res.naturalRemedies?.length > 0
        ? `🌿 *Natural Remedies:*\n${res.naturalRemedies.map((r: string, i: number) => `${i + 1}. ${r}`).join("\n")}\n\n`
        : "") +
      (res.englishMedicine ? `💊 *Medicine:* ${res.englishMedicine}\n` : "") +
      (res.timeToHeal ? `⏰ *Heal Time:* ${res.timeToHeal}\n` : "") +
      (res.severity === "severe" || res.severity === "critical"
        ? `\n🆘 *Please help immediately! Call 108 if needed.*`
        : `\nPlease check on them soon.`) +
      `\n\n🤖 *KrishiHealth AI*`;
    const cleanPhone =
      name && res
        ? familyPhone.replace(/\+91/g, "").replace(/\s/g, "").replace(/-/g, "")
        : "";
    const url = cleanPhone
      ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;

    window.open(url, "_blank");
    setSmsSent(true);
  }

  // ── Injury detection mutation ────────────────────────────────────────────────
  const injuryMutation = useMutation({
    mutationFn: async () => {
      if (!injuryImage) throw new Error("No image");
      const formData = new FormData();
      formData.append("image", injuryImage);
      formData.append("language", language);
      formData.append("farmerName", farmerName || "Farmer");
      formData.append("familyPhone", familyPhone);
      const res = await fetch("/api/injury-detect", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to analyze");
      return res.json();
    },
    onSuccess: (data) => {
      setInjuryResult(data);
      setSmsSent(false);
      queryClient.invalidateQueries({ queryKey: ["/api/sms-alerts"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to analyze injury. Please try again.",
        variant: "destructive",
      });
    },
  });

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setInjuryImage(file);
      setInjuryPreview(URL.createObjectURL(file));
      setInjuryResult(null);
      setSmsSent(false);
    }
  }

  function resetInjury() {
    setInjuryImage(null);
    setInjuryPreview(null);
    setInjuryResult(null);
    setSmsSent(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  }

  const severityConfig: Record<
    string,
    { bg: string; color: string; label: string; emoji: string }
  > = {
    mild: {
      bg: "bg-green-50 dark:bg-green-950/20 border border-green-300",
      color: "text-green-700",
      label:
        language === "te" ? "తేలికపాటి" : language === "hi" ? "हल्का" : "Mild",
      emoji: "✅",
    },
    moderate: {
      bg: "bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-300",
      color: "text-yellow-700",
      label:
        language === "te"
          ? "మధ్యస్థం"
          : language === "hi"
            ? "मध्यम"
            : "Moderate",
      emoji: "⚠️",
    },
    severe: {
      bg: "bg-orange-50 dark:bg-orange-950/20 border border-orange-400",
      color: "text-orange-700",
      label:
        language === "te"
          ? "తీవ్రమైనది"
          : language === "hi"
            ? "गंभीर"
            : "Severe",
      emoji: "🚨",
    },
    critical: {
      bg: "bg-red-100 dark:bg-red-950/40 border-2 border-red-500",
      color: "text-red-700",
      label:
        language === "te"
          ? "అత్యంత తీవ్రం"
          : language === "hi"
            ? "अत्यंत गंभीर"
            : "Critical",
      emoji: "🆘",
    },
  };

  // ── Health checkin mutation ──────────────────────────────────────────────────
  const checkinMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, string> = {};
      questions.forEach((q) => {
        payload[q.question] = answers[q.key] || "";
      });
      const res = await apiRequest("POST", "/api/health-checkin", {
        sessionType: session.type,
        language,
        answers: payload,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setResult(data);
      setStep("result");
      queryClient.invalidateQueries({ queryKey: ["/api/health-checkins"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process. Please try again.",
        variant: "destructive",
      });
    },
  });

  function handleAnswer(answer: string) {
    const q = questions[currentQ];
    setAnswers((prev) => ({ ...prev, [q.key]: answer }));
    if (currentQ < questions.length - 1) setCurrentQ((p) => p + 1);
    else checkinMutation.mutate();
  }

  function reset() {
    setStep("intro");
    setCurrentQ(0);
    setAnswers({});
    setResult(null);
  }

  const statusConfig = {
    green: {
      bg: "bg-green-50 dark:bg-green-950/20 border border-green-300",
      color: "text-green-600",
      emoji: "✅",
      label:
        language === "te"
          ? "మీరు చాలా బాగున్నారు!"
          : language === "hi"
            ? "आप बिल्कुल ठीक हैं!"
            : "You are doing great!",
    },
    yellow: {
      bg: "bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-300",
      color: "text-yellow-600",
      emoji: "⚠️",
      label:
        language === "te"
          ? "కొంచెం జాగ్రత్త అవసరం"
          : language === "hi"
            ? "थोड़ी सावधानी जरूरी"
            : "Some caution needed",
    },
    red: {
      bg: "bg-red-50 dark:bg-red-950/20 border border-red-300",
      color: "text-red-600",
      emoji: "🚨",
      label:
        language === "te"
          ? "వెంటనే డాక్టర్ దగ్గరకు వెళ్ళండి"
          : language === "hi"
            ? "तुरंत डॉक्टर के पास जाएं"
            : "See doctor immediately",
    },
    critical: {
      bg: "bg-red-100 dark:bg-red-950/40 border-2 border-red-500",
      color: "text-red-700",
      emoji: "🆘",
      label:
        language === "te"
          ? "అత్యవసరం! 108 కి call చేయండి"
          : language === "hi"
            ? "आपातकाल! 108 पर कॉल करें"
            : "Emergency! Call 108",
    },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <HeartPulse className="text-primary" size={22} />
        <h2 className="text-xl font-bold">{tx.healthCheckin}</h2>
      </div>

      {/* Tab Switcher */}
      <div className="grid grid-cols-2 gap-2 bg-muted rounded-xl p-1">
        <Button
          variant={activeTab === "checkin" ? "default" : "ghost"}
          className="rounded-lg text-sm h-10"
          onClick={() => setActiveTab("checkin")}
        >
          <HeartPulse size={15} className="mr-1.5" />
          {language === "te"
            ? "ఆరోగ్య తనిఖీ"
            : language === "hi"
              ? "स्वास्थ्य जांच"
              : "Health Check"}
        </Button>
        <Button
          variant={activeTab === "injury" ? "default" : "ghost"}
          className="rounded-lg text-sm h-10"
          onClick={() => setActiveTab("injury")}
        >
          <Bandage size={15} className="mr-1.5" />
          {language === "te"
            ? "గాయం తనిఖీ"
            : language === "hi"
              ? "चोट जांच"
              : "Injury Check"}
        </Button>
      </div>

      {/* ══════════════ INJURY TAB ══════════════ */}
      {activeTab === "injury" && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Bandage size={18} className="text-orange-500" />
                {language === "te"
                  ? "గాయం / చోట్ల తనిఖీ"
                  : language === "hi"
                    ? "घाव / चोट की जांच"
                    : "Injury & Wound Detection"}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {language === "te"
                  ? "గాయం ఫోటో తీసి AI విశ్లేషణ పొందండి"
                  : language === "hi"
                    ? "चोट की फोटो लें और AI विश्लेषण पाएं"
                    : "Take a photo of your injury for AI analysis"}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Name + Phone */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    {language === "te"
                      ? "మీ పేరు"
                      : language === "hi"
                        ? "आपका नाम"
                        : "Your Name"}
                  </label>
                  <Input
                    value={farmerName}
                    onChange={(e) => setFarmerName(e.target.value)}
                    placeholder={
                      language === "te"
                        ? "పేరు"
                        : language === "hi"
                          ? "नाम"
                          : "Name"
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    {language === "te"
                      ? "ఫోన్ నంబర్"
                      : language === "hi"
                        ? "फ़ोन नंबर"
                        : "Phone Number"}
                  </label>
                  <Input
                    value={familyPhone}
                    onChange={(e) => setFamilyPhone(e.target.value)}
                    placeholder="9876543210"
                    type="tel"
                  />
                </div>
              </div>

              {/* Hidden inputs */}
              <input
                type="file"
                ref={cameraInputRef}
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleImageSelect}
              />
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />

              {!injuryPreview ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => cameraInputRef.current?.click()}
                      className="border-2 border-orange-300 rounded-xl p-4 text-center hover:border-orange-500 active:scale-95 transition-all bg-orange-50 dark:bg-orange-950/20"
                    >
                      <Camera
                        size={28}
                        className="mx-auto text-orange-500 mb-1"
                      />
                      <p className="text-xs font-semibold text-orange-600">
                        {language === "te"
                          ? "📷 ఫోటో తీయండి"
                          : language === "hi"
                            ? "📷 फोटो लें"
                            : "📷 Take Photo"}
                      </p>
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-blue-300 rounded-xl p-4 text-center hover:border-blue-500 active:scale-95 transition-all bg-blue-50 dark:bg-blue-950/20"
                    >
                      <span className="text-2xl block mb-1">🖼️</span>
                      <p className="text-xs font-semibold text-blue-600">
                        {language === "te"
                          ? "గ్యాలరీ నుండి"
                          : language === "hi"
                            ? "गैलरी से चुनें"
                            : "From Gallery"}
                      </p>
                    </button>
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    {language === "te"
                      ? "గాయం ఫోటో తీసి AI విశ్లేషణ పొందండి"
                      : language === "hi"
                        ? "चोट की फोटो से AI विश्लेषण पाएं"
                        : "AI will analyze your injury photo"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden">
                    <img
                      src={injuryPreview}
                      alt="Injury"
                      className="w-full max-h-56 object-cover"
                    />
                    <button
                      onClick={resetInjury}
                      className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs"
                    >
                      ✕
                    </button>
                  </div>
                  {!injuryResult && (
                    <Button
                      className="farmer-btn w-full bg-orange-500 hover:bg-orange-600"
                      onClick={() => injuryMutation.mutate()}
                      disabled={injuryMutation.isPending}
                    >
                      {injuryMutation.isPending ? (
                        <span className="animate-pulse">
                          {language === "te"
                            ? "AI విశ్లేషిస్తోంది..."
                            : language === "hi"
                              ? "AI विश्लेषण हो रहा है..."
                              : "AI Analyzing..."}
                        </span>
                      ) : (
                        <>
                          <AlertCircle size={18} className="mr-2" />
                          {language === "te"
                            ? "విశ్లేషించు"
                            : language === "hi"
                              ? "विश्लेषण करें"
                              : "Analyze Injury"}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Injury Result ── */}
          {injuryResult &&
            (() => {
              const sev = injuryResult.severity || "mild";
              const cfg = severityConfig[sev] || severityConfig.mild;
              const isEmergency = sev === "severe" || sev === "critical";
              return (
                <div className="space-y-3">
                  {/* Emergency Banner */}
                  {isEmergency && (
                    <div className="bg-red-600 text-white rounded-xl p-4 animate-pulse">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">🆘</span>
                        <p className="font-bold text-lg">
                          {sev === "critical"
                            ? language === "te"
                              ? "అత్యవసరం! వెంటనే 108 కి call చేయండి!"
                              : language === "hi"
                                ? "आपातकाल! तुरंत 108 पर कॉल करें!"
                                : "EMERGENCY! Call 108 Immediately!"
                            : language === "te"
                              ? "తీవ్రమైన గాయం - వైద్యుడిని సంప్రదించండి"
                              : language === "hi"
                                ? "गंभीर चोट - डॉक्टर से मिलें"
                                : "Serious Injury - See Doctor Now"}
                        </p>
                      </div>
                      <a
                        href="tel:108"
                        className="block mt-3 bg-white text-red-600 font-bold py-2 rounded-lg text-center text-lg"
                      >
                        <Phone size={18} className="inline mr-2" />
                        108 —{" "}
                        {language === "te"
                          ? "అత్యవసర సేవలు"
                          : language === "hi"
                            ? "आपातकालीन सेवाएं"
                            : "Emergency Services"}
                      </a>
                    </div>
                  )}

                  {/* Severity */}
                  <div className={`rounded-xl p-4 ${cfg.bg}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{cfg.emoji}</span>
                      <div>
                        <div
                          className={`font-bold ${cfg.color} flex items-center gap-2 flex-wrap`}
                        >
                          <span>
                            {language === "te"
                              ? "తీవ్రత:"
                              : language === "hi"
                                ? "गंभीरता:"
                                : "Severity:"}
                          </span>
                          <Badge variant="outline" className={cfg.color}>
                            {cfg.label}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium mt-0.5">
                          {injuryResult.woundType}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Card className="border-green-300 bg-green-50 dark:bg-green-950/20">
                    <CardContent className="p-4 space-y-3">
                      <p className="text-sm font-semibold text-green-700">
                        📤{" "}
                        {language === "te"
                          ? "WhatsApp లో Share చేయండి"
                          : language === "hi"
                            ? "WhatsApp पर Share करें"
                            : "Share on WhatsApp"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {language === "te"
                          ? "గాయం వివరాలు WhatsApp లో family/friends కి పంపండి"
                          : language === "hi"
                            ? "चोट की जानकारी WhatsApp पर परिवार को भेजें"
                            : "Send injury details to family/friends via WhatsApp"}
                      </p>
                      <Button
                        onClick={() =>
                          shareInjuryWhatsApp(farmerName, injuryResult)
                        }
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        📤{" "}
                        {language === "te"
                          ? "WhatsApp లో Share చేయండి"
                          : language === "hi"
                            ? "WhatsApp पर Share करें"
                            : "Share on WhatsApp"}
                      </Button>
                      {smsSent && (
                        <p className="text-xs text-green-700 font-medium">
                          ✅{" "}
                          {language === "te"
                            ? "WhatsApp తెరుచుకుంది!"
                            : language === "hi"
                              ? "WhatsApp खुल गया!"
                              : "WhatsApp opened!"}
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Natural Remedies */}
                  {injuryResult.naturalRemedies?.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2 text-green-700">
                          <Leaf size={16} />
                          {language === "te"
                            ? "ఇంటి చిట్కాలు (సహజ చికిత్స)"
                            : language === "hi"
                              ? "घरेलू उपाय (प्राकृतिक)"
                              : "Natural Home Remedies"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {injuryResult.naturalRemedies.map(
                            (remedy: string, i: number) => (
                              <li key={i} className="flex gap-2 text-sm">
                                <span className="text-green-500 font-bold">
                                  {i + 1}.
                                </span>
                                <span>{remedy}</span>
                              </li>
                            ),
                          )}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Medicine */}
                  {injuryResult.englishMedicine && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2 text-blue-600">
                          <Pill size={16} />
                          {language === "te"
                            ? "మందు (అవసరమైతే)"
                            : language === "hi"
                              ? "दवाई (यदि जरूरी)"
                              : "Medicine (if needed)"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm font-medium">
                          {injuryResult.englishMedicine}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Healing Info */}
                  <Card>
                    <CardContent className="p-4 space-y-2">
                      {injuryResult.timeToHeal && (
                        <div className="flex gap-2 text-sm">
                          <span className="font-medium min-w-fit">
                            {language === "te"
                              ? "నయమవడానికి:"
                              : language === "hi"
                                ? "ठीक होने में:"
                                : "Time to heal:"}
                          </span>
                          <span>{injuryResult.timeToHeal}</span>
                        </div>
                      )}
                      {injuryResult.warningIfIgnored && (
                        <div className="flex gap-2 text-sm text-orange-600">
                          <AlertTriangle
                            size={14}
                            className="mt-0.5 shrink-0"
                          />
                          <span>{injuryResult.warningIfIgnored}</span>
                        </div>
                      )}
                      {injuryResult.emergencyAction && (
                        <div className="flex gap-2 text-sm text-red-600 font-medium">
                          <XCircle size={14} className="mt-0.5 shrink-0" />
                          <span>{injuryResult.emergencyAction}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Button
                    variant="outline"
                    className="farmer-btn w-full"
                    onClick={resetInjury}
                  >
                    {language === "te"
                      ? "మళ్ళీ తనిఖీ చేయండి"
                      : language === "hi"
                        ? "फिर से जांचें"
                        : "Check Another Injury"}
                  </Button>
                </div>
              );
            })()}
        </div>
      )}

      {/* ══════════════ HEALTH CHECKIN TAB ══════════════ */}
      {activeTab === "checkin" && step === "intro" && (
        <Card>
          <CardContent className="p-6 space-y-4 text-center">
            <div className="text-5xl">{sessionEmoji[session.type]}</div>
            <div>
              <h3 className="text-lg font-bold mb-1">{session.label}</h3>
              <p className="text-sm text-muted-foreground">
                {language === "te"
                  ? `${questions.length} ప్రశ్నలు అడుగుతాం. నిజాయితీగా సమాధానం ఇవ్వండి.`
                  : language === "hi"
                    ? `${questions.length} सवाल पूछे जाएंगे। सही जवाब दें।`
                    : `We'll ask you ${questions.length} health questions. Answer honestly for best advice.`}
              </p>
            </div>
            <Button
              className="farmer-btn w-full"
              onClick={() => setStep("questions")}
            >
              {tx.startCheckin}
            </Button>
          </CardContent>
        </Card>
      )}

      {activeTab === "checkin" && step === "questions" && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-medium">
                {currentQ + 1} / {questions.length}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  isSpeaking
                    ? stopSpeaking()
                    : speak(questions[currentQ].question)
                }
              >
                {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </Button>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentQ / questions.length) * 100}%` }}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-base font-semibold leading-snug">
              {questions[currentQ].question}
            </p>
            <div className="space-y-2">
              {questions[currentQ].options.map((opt) => (
                <Button
                  key={opt}
                  variant="outline"
                  className="w-full justify-start text-left"
                  onClick={() => handleAnswer(opt)}
                  disabled={checkinMutation.isPending}
                >
                  {opt}
                </Button>
              ))}
            </div>
            <Button
              variant="ghost"
              className={`w-full text-sm ${isListening ? "text-red-500" : "text-muted-foreground"}`}
              onClick={() =>
                isListening
                  ? stopListening()
                  : startListening((text) => handleAnswer(text))
              }
            >
              {isListening ? (
                <MicOff size={16} className="mr-2" />
              ) : (
                <Mic size={16} className="mr-2" />
              )}
              {isListening
                ? language === "te"
                  ? "వింటున్నాను..."
                  : language === "hi"
                    ? "सुन रहा हूँ..."
                    : "Listening..."
                : language === "te"
                  ? "వాయిస్ ద్వారా సమాధానం"
                  : language === "hi"
                    ? "आवाज़ से जवाब दें"
                    : "Answer by voice"}
            </Button>
            {currentQ > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentQ((p) => p - 1)}
              >
                {language === "te"
                  ? "← వెనక్కి"
                  : language === "hi"
                    ? "← वापस"
                    : "← Back"}
              </Button>
            )}
            {checkinMutation.isPending && (
              <div className="text-center text-sm text-muted-foreground animate-pulse">
                {language === "te"
                  ? "AI విశ్లేషిస్తోంది..."
                  : language === "hi"
                    ? "AI विश्लेषण कर रहा है..."
                    : "AI is analyzing..."}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "checkin" &&
        step === "result" &&
        result &&
        (() => {
          const cfg =
            statusConfig[result.status as keyof typeof statusConfig] ||
            statusConfig.green;
          return (
            <div className="space-y-4">
              <div className={`rounded-xl p-4 ${cfg.bg}`}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{cfg.emoji}</span>
                  <div className="flex-1">
                    <p className={`font-bold text-base ${cfg.color}`}>
                      {cfg.label}
                    </p>
                    {result.statusMessage && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {result.statusMessage}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      isSpeaking ? stopSpeaking() : speak(result.advice || "")
                    }
                  >
                    {isSpeaking ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </Button>
                </div>
              </div>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    {language === "te"
                      ? "AI సలహా"
                      : language === "hi"
                        ? "AI सलाह"
                        : "AI Advice"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{result.advice}</p>
                </CardContent>
              </Card>
              {result.tips?.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">
                      {language === "te"
                        ? "చిట్కాలు"
                        : language === "hi"
                          ? "सुझाव"
                          : "Tips"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.tips.map((tip: string, i: number) => (
                        <li key={i} className="flex gap-2 text-sm">
                          <span className="text-primary">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
              {(result.status === "red" || result.status === "critical") && (
                <Card className="border-red-400 bg-red-50 dark:bg-red-950/20">
                  <CardContent className="p-4 space-y-2">
                    {result.status === "critical" && (
                      <div className="text-center">
                        <p className="text-lg font-bold text-red-700">
                          🆘 అత్యవసరం!
                        </p>
                        <a
                          href="tel:108"
                          className="block mt-2 bg-red-600 text-white py-2 rounded-lg text-center font-bold"
                        >
                          📞 108
                        </a>
                      </div>
                    )}
                    {result.status === "red" && (
                      <>
                        <p className="text-xs font-semibold text-red-600">
                          {language === "te"
                            ? "దగ్గరలో PHC"
                            : language === "hi"
                              ? "नज़दीकी PHC"
                              : "Nearest PHC"}
                        </p>
                        <p className="text-sm font-medium">
                          {result.nearestPHC || "Contact 104 for nearest PHC"}
                        </p>
                        <a
                          href="tel:104"
                          className="block mt-1 bg-orange-500 text-white py-2 rounded-lg text-center font-bold text-sm"
                        >
                          📞 104 — Health Helpline
                        </a>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
              <Button className="farmer-btn w-full" onClick={reset}>
                {language === "te"
                  ? "మళ్ళీ చేయండి"
                  : language === "hi"
                    ? "फिर से करें"
                    : "Start New Check-in"}
              </Button>
            </div>
          );
        })()}
    </div>
  );
}
