import { useState, useRef, useCallback } from "react";
import type { Language } from "@/lib/language";

const LANG_CODES: Record<string, string> = {
  en: "en-IN",
  te: "te-IN",
  hi: "hi-IN",
  bn: "bn-IN",
  ta: "ta-IN",
  mr: "mr-IN",
  gu: "gu-IN",
  kn: "kn-IN",
  ml: "ml-IN",
  pa: "pa-IN",
  ur: "ur-PK",
};

export function useVoice(language: Language) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState<boolean | null>(null);
  const recognitionRef = useRef<any>(null);

  const startListening = useCallback(
    async (onResult: (text: string) => void) => {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setVoiceSupported(false);
        alert(
          language === "te"
            ? "వాయిస్ ఇన్‌పుట్ ఈ బ్రౌజర్‌లో పని చేయదు. దయచేసి Google Chrome లేదా Samsung Internet వాడండి."
            : language === "hi"
              ? "Voice input इस browser में काम नहीं करता। Google Chrome या Samsung Internet उपयोग करें।"
              : "Voice input not supported. Please use Google Chrome or Samsung Internet browser.",
        );
        return;
      }

      setVoiceSupported(true);

      // Ask for mic permission — needed on some mobile browsers
      try {
        await navigator.mediaDevices?.getUserMedia({ audio: true });
      } catch {
        alert(
          language === "te"
            ? "మైక్రోఫోన్ అనుమతి నిరాకరించబడింది. Browser Settings లో మైక్రోఫోన్ అనుమతి ఇవ్వండి."
            : language === "hi"
              ? "माइक्रोफ़ोन की अनुमति नहीं मिली। Browser Settings में माइक्रोफ़ोन permission दें।"
              : "Microphone access denied. Please allow microphone in browser settings.",
        );
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = LANG_CODES[language] || "en-IN";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;

      recognition.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        onResult(transcript);
        setIsListening(false);
      };

      recognition.onerror = (e: any) => {
        console.error("Speech recognition error:", e.error);
        setIsListening(false);
        if (e.error === "not-allowed") {
          alert(
            language === "te"
              ? "మైక్రోఫోన్ అనుమతి లేదు. Browser settings లో అనుమతి ఇవ్వండి."
              : language === "hi"
                ? "माइक्रोफ़ोन permission नहीं है।"
                : "Microphone not allowed. Check browser permissions.",
          );
        } else if (e.error === "network") {
          alert(
            language === "te"
              ? "నెట్‌వర్క్ సమస్య. Internet connection చూడండి."
              : language === "hi"
                ? "Network error। Internet connection जांचें।"
                : "Network error. Please check your internet connection.",
          );
        } else if (e.error === "no-speech") {
          alert(
            language === "te"
              ? "మాట్లాడలేదు. మళ్ళీ ప్రయత్నించండి."
              : language === "hi"
                ? "कोई बोली नहीं सुनाई दी। फिर कोशिश करें।"
                : "No speech detected. Please try again.",
          );
        }
      };

      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;

      try {
        recognition.start();
        setIsListening(true);
      } catch (err) {
        console.error("Failed to start recognition:", err);
        setIsListening(false);
      }
    },
    [language],
  );

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = LANG_CODES[language] || "en-IN";
      utterance.rate = 0.85;
      utterance.pitch = 1;
      utterance.volume = 1;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    },
    [language],
  );

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  return {
    isListening,
    isSpeaking,
    voiceSupported,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
}
