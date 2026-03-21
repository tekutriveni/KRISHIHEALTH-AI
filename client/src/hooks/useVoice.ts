import { useState, useRef, useCallback } from "react";
import type { Language } from "@/lib/language";

const LANG_CODES: Record<Language, string> = {
  en: "en-IN",
  te: "te-IN",
  hi: "hi-IN",
};

export function useVoice(language: Language) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startListening = useCallback((onResult: (text: string) => void) => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Please use Google Chrome.");
      return;
    }

    // Request mic permission first
    navigator.mediaDevices?.getUserMedia({ audio: true }).catch(() => {
      alert("Microphone access denied. Please allow microphone access and try again.");
      return;
    });

    const recognition = new SpeechRecognition();
    recognition.lang = LANG_CODES[language];
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      onResult(transcript);
      setIsListening(false);
    };
    recognition.onerror = (e: any) => {
      console.error("Speech recognition error:", e.error);
      if (e.error === "not-allowed") {
        alert("Microphone access denied. Please allow microphone permission in your browser settings.");
      } else if (e.error === "network") {
        alert("Network error during voice recognition. Please check your connection.");
      }
      setIsListening(false);
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
  }, [language]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANG_CODES[language];
    utterance.rate = 0.9;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [language]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  return { isListening, isSpeaking, startListening, stopListening, speak, stopSpeaking };
}
