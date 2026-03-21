import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { MessageSquare, Send, Mic, MicOff, Volume2, VolumeX, Bot, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/lib/language";
import { useVoice } from "@/hooks/useVoice";
import { apiRequest } from "@/lib/queryClient";
import type { Language } from "@/lib/language";

interface Message {
  role: "user" | "ai";
  content: string;
  time: string;
}

interface ChatProps {
  language: Language;
}

export default function Chat({ language }: ChatProps) {
  const tx = useTranslation(language);
  const { isListening, isSpeaking, startListening, stopListening, speak, stopSpeaking } = useVoice(language);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      content:
        language === "te"
          ? "నమస్కారం! నేను కృషిహెల్త్ AI. మీ వ్యవసాయ ప్రశ్నలకు సహాయపడతాను. మీరు ఏమి అడగాలనుకుంటున్నారు?"
          : language === "hi"
          ? "नमस्ते! मैं कृषिहेल्थ AI हूँ। आपके खेती के सवालों में मदद करूँगा। क्या पूछना है?"
          : "Namaste! I'm KrishiHealth AI. Ask me anything about farming, crops, weather, or health. How can I help you today?",
      time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest("/api/ai-chat", {
        method: "POST",
        body: JSON.stringify({ message, language }),
      });
      return res as { reply: string };
    },
    onSuccess: (data) => {
      const aiMsg: Message = {
        role: "ai",
        content: data.reply,
        time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: "Sorry, I couldn't respond. Please try again.",
          time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    },
  });

  function sendMessage(text?: string) {
    const msg = text || input.trim();
    if (!msg) return;
    const userMsg: Message = {
      role: "user",
      content: msg,
      time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    chatMutation.mutate(msg);
  }

  function handleVoice() {
    if (isListening) stopListening();
    else startListening((text) => {
      setInput(text);
      sendMessage(text);
    });
  }

  function speakLast() {
    const lastAi = [...messages].reverse().find((m) => m.role === "ai");
    if (!lastAi) return;
    if (isSpeaking) stopSpeaking();
    else speak(lastAi.content);
  }

  const SUGGESTIONS = {
    en: ["How to treat rice blast?", "Best time to sow cotton?", "How to improve soil fertility?", "Pest control for chilli?"],
    te: ["వరి బ్లాస్ట్ చికిత్స?", "పత్తి విత్తే సమయం?", "నేల సారాన్ని మెరుగుపరచాలి?", "మిరప పురుగుల నివారణ?"],
    hi: ["धान का झुलसा कैसे ठीक करें?", "कपास कब बोएं?", "मिट्टी की उर्वरता बढ़ाएं?", "मिर्च में कीट नियंत्रण?"],
  };
  const suggestions = SUGGESTIONS[language] || SUGGESTIONS.en;

  return (
    <div className="flex flex-col h-[calc(100vh-160px)]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="text-primary" size={22} />
          <h2 className="text-xl font-bold">{tx.aiChat}</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={speakLast} data-testid="button-speak-last">
          {isSpeaking ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            data-testid={`message-${msg.role}-${i}`}
          >
            <div
              className={`rounded-full p-1.5 h-8 w-8 flex items-center justify-center shrink-0 ${
                msg.role === "ai" ? "bg-primary text-white" : "bg-secondary"
              }`}
            >
              {msg.role === "ai" ? <Bot size={16} /> : <User size={16} />}
            </div>
            <div className={`max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
              <div
                className={`rounded-xl p-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-white rounded-tr-none"
                    : "bg-card border rounded-tl-none"
                }`}
              >
                {msg.content}
              </div>
              <span className="text-xs text-muted-foreground px-1">{msg.time}</span>
            </div>
          </div>
        ))}
        {chatMutation.isPending && (
          <div className="flex gap-2">
            <div className="rounded-full p-1.5 h-8 w-8 flex items-center justify-center bg-primary text-white shrink-0">
              <Bot size={16} />
            </div>
            <div className="bg-card border rounded-xl rounded-tl-none p-3">
              <div className="flex gap-1 items-center">
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions (show when few messages) */}
      {messages.length <= 2 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-2">
          {suggestions.map((s) => (
            <button
              key={s}
              className="shrink-0 text-xs bg-secondary text-secondary-foreground rounded-full px-3 py-1.5 hover:bg-primary hover:text-white transition-colors"
              onClick={() => sendMessage(s)}
              data-testid={`button-suggestion-${s.slice(0, 10)}`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 items-end">
        <Textarea
          className="flex-1 min-h-[44px] max-h-32 resize-none text-sm"
          placeholder={tx.typeMessage}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          data-testid="textarea-chat-input"
        />
        <div className="flex flex-col gap-1">
          <Button
            variant="outline"
            size="icon"
            className={`h-9 w-9 ${isListening ? "border-red-400 bg-red-50 dark:bg-red-950/30 recording-pulse" : ""}`}
            onClick={handleVoice}
            data-testid="button-voice-chat"
          >
            {isListening ? <MicOff size={16} className="text-red-500" /> : <Mic size={16} />}
          </Button>
          <Button
            size="icon"
            className="h-9 w-9"
            onClick={() => sendMessage()}
            disabled={!input.trim() || chatMutation.isPending}
            data-testid="button-send-chat"
          >
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
