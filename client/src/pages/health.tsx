import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { HeartPulse, Mic, MicOff, Volume2, VolumeX, CheckCircle2, AlertTriangle, XCircle, ChevronRight, ChevronLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/language";
import { useVoice } from "@/hooks/useVoice";
import { apiRequest } from "@/lib/queryClient";
import type { Language } from "@/lib/language";

interface HealthProps {
  language: Language;
}

const HEALTH_QUESTIONS = {
  en: [
    { key: "fever", question: "Do you have fever or body temperature above 99°F?", options: ["Yes", "No", "Not sure"] },
    { key: "headache", question: "Do you have headache or dizziness?", options: ["Yes, severe", "Yes, mild", "No"] },
    { key: "fatigue", question: "Are you feeling extreme fatigue or weakness?", options: ["Yes, can't work", "Yes, but manageable", "No"] },
    { key: "water", question: "Have you drunk enough water today? (At least 3 liters)", options: ["Yes", "No", "I forget to drink"] },
    { key: "food", question: "Did you eat properly today?", options: ["Yes, 3 meals", "Only 1-2 meals", "No"] },
    { key: "pain", question: "Do you have any body pain (back, joints, chest)?", options: ["Yes, chest pain", "Yes, back/joints", "No pain"] },
    { key: "skin", question: "Any skin rashes, itching or wounds from farming?", options: ["Yes, needs treatment", "Minor cuts", "No"] },
    { key: "vision", question: "Any vision problems or eye irritation?", options: ["Yes", "Mild", "No"] },
  ],
  te: [
    { key: "fever", question: "మీకు జ్వరం లేదా శరీర ఉష్ణోగ్రత 99°F పైన ఉందా?", options: ["అవును", "లేదు", "తెలియదు"] },
    { key: "headache", question: "మీకు తలనొప్పి లేదా తలతిరగడం ఉందా?", options: ["అవును, తీవ్రంగా", "అవును, కొంచెం", "లేదు"] },
    { key: "fatigue", question: "మీరు చాలా అలసటగా లేదా బలహీనంగా అనిపిస్తోందా?", options: ["అవును, పని చేయలేను", "అవును, కానీ భరించగలను", "లేదు"] },
    { key: "water", question: "మీరు నేడు తగినంత నీళ్ళు తాగారా? (కనీసం 3 లీటర్లు)", options: ["అవును", "లేదు", "మర్చిపోయాను"] },
    { key: "food", question: "మీరు నేడు సరిగ్గా తిన్నారా?", options: ["అవును, 3 పూటలు", "1-2 పూటలు మాత్రమే", "తినలేదు"] },
    { key: "pain", question: "మీకు శరీర నొప్పి ఉందా (వీపు, కీళ్ళు, ఛాతీ)?", options: ["అవును, ఛాతీ నొప్పి", "అవును, వీపు/కీళ్ళు", "నొప్పి లేదు"] },
    { key: "skin", question: "వ్యవసాయం వల్ల చర్మంపై దద్దుర్లు లేదా గాయాలు ఉన్నాయా?", options: ["అవును, చికిత్స అవసరం", "చిన్న గాయాలు", "లేదు"] },
    { key: "vision", question: "చూపు సమస్యలు లేదా కంటి జ్వలన ఉందా?", options: ["అవును", "కొంచెం", "లేదు"] },
  ],
  hi: [
    { key: "fever", question: "क्या आपको बुखार या 99°F से ऊपर तापमान है?", options: ["हाँ", "नहीं", "पता नहीं"] },
    { key: "headache", question: "क्या आपको सिरदर्द या चक्कर आ रहे हैं?", options: ["हाँ, बहुत तेज", "हाँ, थोड़ा", "नहीं"] },
    { key: "fatigue", question: "क्या आप बहुत थका हुआ या कमज़ोर महसूस कर रहे हैं?", options: ["हाँ, काम नहीं कर सकता", "हाँ, पर ठीक है", "नहीं"] },
    { key: "water", question: "क्या आपने आज पर्याप्त पानी पिया? (कम से कम 3 लीटर)", options: ["हाँ", "नहीं", "भूल जाता हूँ"] },
    { key: "food", question: "क्या आपने आज ठीक से खाना खाया?", options: ["हाँ, 3 बार", "केवल 1-2 बार", "नहीं"] },
    { key: "pain", question: "क्या आपको शरीर में दर्द है (पीठ, जोड़, छाती)?", options: ["हाँ, सीने में दर्द", "हाँ, पीठ/जोड़", "कोई दर्द नहीं"] },
    { key: "skin", question: "खेती से त्वचा पर कोई दाने या घाव हैं?", options: ["हाँ, इलाज चाहिए", "छोटे घाव", "नहीं"] },
    { key: "vision", question: "आँखों में कोई समस्या या जलन है?", options: ["हाँ", "थोड़ी", "नहीं"] },
  ],
};

function getCurrentSession(): { type: string; label: string } {
  const h = new Date().getHours();
  if (h < 10) return { type: "morning", label: "morning" };
  if (h < 15) return { type: "noon", label: "noon" };
  return { type: "evening", label: "evening" };
}

export default function Health({ language }: HealthProps) {
  const tx = useTranslation(language);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isListening, isSpeaking, startListening, stopListening, speak, stopSpeaking } = useVoice(language);

  const [step, setStep] = useState<"intro" | "questions" | "result">("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any>(null);

  const questions = HEALTH_QUESTIONS[language] || HEALTH_QUESTIONS.en;
  const session = getCurrentSession();

  const checkinMutation = useMutation({
    mutationFn: async () => {
      const answersPayload: Record<string, string> = {};
      questions.forEach((q) => {
        answersPayload[q.question] = answers[q.key] || "";
      });
      const res = await apiRequest("POST", "/api/health-checkin", {
        sessionType: session.type,
        language,
        answers: answersPayload,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setResult(data);
      setStep("result");
      queryClient.invalidateQueries({ queryKey: ["/api/health-checkins"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to process. Please try again.", variant: "destructive" });
    },
  });

  function handleAnswer(answer: string) {
    const q = questions[currentQ];
    setAnswers((prev) => ({ ...prev, [q.key]: answer }));
    if (currentQ < questions.length - 1) {
      setCurrentQ((prev) => prev + 1);
    } else {
      checkinMutation.mutate();
    }
  }

  function speakAdvice() {
    if (!result) return;
    if (isSpeaking) stopSpeaking();
    else speak(result.advice || "");
  }

  function speakQuestion() {
    if (step === "questions") {
      const q = questions[currentQ];
      if (isListening) stopListening();
      else speak(q.question);
    }
  }

  function reset() {
    setStep("intro");
    setCurrentQ(0);
    setAnswers({});
    setResult(null);
  }

  const statusConfig = {
    green: { color: "status-green", icon: CheckCircle2, label: tx.statusGreen, emoji: "✅" },
    yellow: { color: "status-yellow", icon: AlertTriangle, label: tx.statusYellow, emoji: "⚠️" },
    red: { color: "status-red", icon: XCircle, label: tx.statusRed, emoji: "🚨" },
  };

  const sessionLabels: Record<string, string> = {
    morning: tx.morningSession,
    noon: tx.noonSession,
    evening: tx.eveningSession,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <HeartPulse className="text-primary" size={22} />
        <h2 className="text-xl font-bold">{tx.healthCheckin}</h2>
      </div>

      {/* Intro */}
      {step === "intro" && (
        <Card>
          <CardContent className="p-6 space-y-4 text-center">
            <div className="text-5xl">💊</div>
            <div>
              <h3 className="text-lg font-bold mb-1">{sessionLabels[session.type]}</h3>
              <p className="text-sm text-muted-foreground">
                {language === "te"
                  ? `${questions.length} ప్రశ్నలు అడుగుతాం. మీరు సరిగ్గా సమాధానం ఇవ్వండి.`
                  : language === "hi"
                  ? `${questions.length} सवाल पूछे जाएंगे। सही जवाब दें।`
                  : `We'll ask you ${questions.length} health questions. Answer honestly for best advice.`}
              </p>
            </div>
            <Button
              className="farmer-btn w-full"
              onClick={() => setStep("questions")}
              data-testid="button-start-checkin"
            >
              {tx.startCheckin}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Questions */}
      {step === "questions" && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-medium">
                {currentQ + 1} / {questions.length}
              </span>
              <Button variant="ghost" size="icon" onClick={speakQuestion} data-testid="button-speak-question">
                {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </Button>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQ) / questions.length) * 100}%` }}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-base font-semibold leading-snug" data-testid="text-question">
              {questions[currentQ].question}
            </p>

            {/* Answer options */}
            <div className="space-y-2">
              {questions[currentQ].options.map((opt) => (
                <Button
                  key={opt}
                  variant="outline"
                  className="w-full farmer-btn justify-start text-left"
                  onClick={() => handleAnswer(opt)}
                  disabled={checkinMutation.isPending}
                  data-testid={`button-answer-${opt.replace(/\s+/g, "-").toLowerCase()}`}
                >
                  {opt}
                </Button>
              ))}
            </div>

            {/* Voice input for custom answer */}
            <Button
              variant="ghost"
              className={`w-full text-sm ${isListening ? "text-red-500 recording-pulse" : "text-muted-foreground"}`}
              onClick={() => {
                if (isListening) stopListening();
                else startListening((text) => handleAnswer(text));
              }}
              data-testid="button-voice-answer"
            >
              {isListening ? <MicOff size={16} className="mr-2" /> : <Mic size={16} className="mr-2" />}
              {isListening ? tx.listening : tx.voiceInput}
            </Button>

            {currentQ > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentQ((p) => p - 1)}
                data-testid="button-back"
              >
                <ChevronLeft size={16} className="mr-1" /> {tx.back}
              </Button>
            )}

            {checkinMutation.isPending && (
              <div className="text-center text-sm text-muted-foreground animate-pulse">
                AI is analyzing your health...
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Result */}
      {step === "result" && result && (() => {
        const cfg = statusConfig[result.status as keyof typeof statusConfig] || statusConfig.green;
        const StatusIcon = cfg.icon;
        return (
          <div className="space-y-4">
            {/* Status Banner */}
            <div className={`rounded-xl p-4 ${cfg.color}`}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{cfg.emoji}</span>
                <div>
                  <p className="font-bold text-base">{cfg.label}</p>
                  {result.statusMessage && (
                    <p className="text-xs opacity-80">{result.statusMessage}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto"
                  onClick={speakAdvice}
                  data-testid="button-speak-advice"
                >
                  {isSpeaking ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </Button>
              </div>
            </div>

            {/* AI Advice */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{tx.aiAdvice}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed" data-testid="text-ai-advice">
                  {result.advice}
                </p>
              </CardContent>
            </Card>

            {/* Tips */}
            {result.tips && result.tips.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{tx.tips}</CardTitle>
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

            {/* Nearest PHC if red */}
            {result.status === "red" && result.nearestPHC && (
              <Card className="border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
                <CardContent className="p-3">
                  <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">{tx.nearestPHC}</p>
                  <p className="text-sm font-medium">{result.nearestPHC}</p>
                </CardContent>
              </Card>
            )}

            <Button
              className="farmer-btn w-full"
              onClick={reset}
              data-testid="button-new-checkin"
            >
              {tx.startCheckin}
            </Button>
          </div>
        );
      })()}
    </div>
  );
}
