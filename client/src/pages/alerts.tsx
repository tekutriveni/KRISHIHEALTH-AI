import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Send,
  CheckCircle2,
  XCircle,
  Mic,
  MicOff,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/language";
import { useVoice } from "@/hooks/useVoice";
import { apiRequest } from "@/lib/queryClient";
import type { Language } from "@/lib/language";
import type { SmsAlert } from "@shared/schema";

interface AlertsProps {
  language: Language;
}

export default function Alerts({ language }: AlertsProps) {
  const tx = useTranslation(language);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isListening, startListening, stopListening } = useVoice(language);

  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [alertType, setAlertType] = useState("disease");

  const { data: alerts, isLoading } = useQuery<SmsAlert[]>({
    queryKey: ["/api/sms-alerts"],
  });

  const { data: smsStatus } = useQuery<{
    configured: boolean;
    reason: string | null;
  }>({
    queryKey: ["/api/sms/status"],
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/sms/send", {
        phoneNumber: phone,
        message,
        type: alertType,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title:
          language === "te"
            ? "SMS పంపబడింది! ✅"
            : language === "hi"
              ? "SMS भेजा गया! ✅"
              : "SMS Sent! ✅",
      });
      setPhone("");
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/sms-alerts"] });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.message || "Failed to send SMS",
        variant: "destructive",
      });
    },
  });

  function handleVoiceMessage() {
    if (isListening) stopListening();
    else startListening((text) => setMessage(text));
  }

  const TEMPLATES = {
    en: [
      "Disease alert: Leaf blast detected in nearby fields. Apply fungicide immediately.",
      "Health advisory: Drink plenty of water during field work. Avoid midday sun.",
      "Market update: Cotton prices have risen. Good time to sell.",
    ],
    te: [
      "వ్యాధి హెచ్చరిక: పొరుగు పొలాల్లో ఆకు బ్లాస్ట్ గుర్తించబడింది. వెంటనే పుప్పొడి మందు వేయండి.",
      "ఆరోగ్య సలహా: పొలంలో పని చేసేటప్పుడు నీళ్ళు తాగండి. మధ్యాహ్న ఎండలో ఉండకండి.",
      "మార్కెట్ నవీకరణ: పత్తి ధరలు పెరిగాయి. అమ్మడానికి మంచి సమయం.",
    ],
    hi: [
      "रोग अलर्ट: पास के खेतों में पत्ती झुलसा पाया गया। तुरंत फफूंदनाशक डालें।",
      "स्वास्थ्य सलाह: खेत में काम करते समय खूब पानी पिएं। दोपहर की धूप से बचें।",
      "बाजार अपडेट: कपास के भाव बढ़े हैं। बेचने का अच्छा समय है।",
    ],
  };
  const templates =
    TEMPLATES[language as keyof typeof TEMPLATES] || TEMPLATES.en;

  const typeLabel: Record<string, string> = {
    disease:
      language === "te" ? "వ్యాధి" : language === "hi" ? "रोग" : "Disease",
    health:
      language === "te"
        ? "ఆరోగ్యం"
        : language === "hi"
          ? "स्वास्थ्य"
          : "Health",
    mandi: language === "te" ? "మండి" : language === "hi" ? "मंडी" : "Mandi",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Bell className="text-primary" size={22} />
        <h2 className="text-xl font-bold">{tx.smsAlerts}</h2>
      </div>

      {/* SMS Status Banner */}
      {smsStatus && (
        <div
          className={`flex gap-3 items-start rounded-xl p-3 border ${
            smsStatus.configured
              ? "bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-800"
              : "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-300 dark:border-yellow-800"
          }`}
        >
          {smsStatus.configured ? (
            <CheckCircle className="text-green-500 shrink-0 mt-0.5" size={18} />
          ) : (
            <AlertTriangle
              className="text-yellow-500 shrink-0 mt-0.5"
              size={18}
            />
          )}
          <div>
            <p
              className={`text-sm font-semibold ${
                smsStatus.configured
                  ? "text-green-700 dark:text-green-300"
                  : "text-yellow-700 dark:text-yellow-300"
              }`}
            >
              {smsStatus.configured
                ? language === "te"
                  ? "✅ SMS సేవా సిద్ధంగా ఉంది!"
                  : language === "hi"
                    ? "✅ SMS सेवा तैयार है!"
                    : "✅ SMS Service Ready!"
                : language === "te"
                  ? "SMS కాన్ఫిగర్ చేయబడలేదు"
                  : language === "hi"
                    ? "SMS कॉन्फ़िगर नहीं है"
                    : "SMS Not Configured"}
            </p>
            {!smsStatus.configured && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-0.5">
                {smsStatus.reason ||
                  "Please set FAST2SMS_API_KEY in Replit Secrets."}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Send Alert Form */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{tx.sendAlert}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Phone Number */}
          <div className="space-y-1">
            <Label className="text-xs">{tx.phone}</Label>
            <Input
              placeholder={
                language === "te"
                  ? "10 అంకెల నంబర్ enter చేయండి"
                  : language === "hi"
                    ? "10 अंकों का नंबर दर्ज करें"
                    : "Enter 10 digit mobile number"
              }
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              data-testid="input-phone"
            />
            <p className="text-xs text-muted-foreground">
              {language === "te"
                ? "ఉదా: 9876543210 లేదా +919876543210"
                : language === "hi"
                  ? "जैसे: 9876543210 या +919876543210"
                  : "e.g: 9876543210 or +919876543210"}
            </p>
          </div>

          {/* Alert Type */}
          <div className="space-y-1">
            <Label className="text-xs">
              {language === "te"
                ? "హెచ్చరిక రకం"
                : language === "hi"
                  ? "अलर्ट प्रकार"
                  : "Alert Type"}
            </Label>
            <Select value={alertType} onValueChange={setAlertType}>
              <SelectTrigger data-testid="select-alert-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="disease">{typeLabel.disease}</SelectItem>
                <SelectItem value="health">{typeLabel.health}</SelectItem>
                <SelectItem value="mandi">{typeLabel.mandi}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Message */}
          <div className="space-y-1">
            <Label className="text-xs">{tx.message}</Label>
            <div className="flex gap-2">
              <Textarea
                placeholder={tx.message}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="flex-1"
                data-testid="textarea-sms-message"
              />
              <Button
                variant="outline"
                size="icon"
                className={`h-10 w-10 self-start ${isListening ? "border-red-400 bg-red-50 dark:bg-red-950/30" : ""}`}
                onClick={handleVoiceMessage}
                data-testid="button-voice-message"
              >
                {isListening ? (
                  <MicOff size={16} className="text-red-500" />
                ) : (
                  <Mic size={16} />
                )}
              </Button>
            </div>
          </div>

          {/* Quick Templates */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              {language === "te"
                ? "త్వరిత మూసలు:"
                : language === "hi"
                  ? "त्वरित टेम्पलेट:"
                  : "Quick templates:"}
            </p>
            <div className="space-y-1">
              {templates.map((t, i) => (
                <button
                  key={i}
                  className="w-full text-left text-xs bg-muted hover:bg-muted/70 rounded-lg p-2 transition-colors line-clamp-2"
                  onClick={() => setMessage(t)}
                  data-testid={`button-template-${i}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Send Button */}
          <Button
            className="w-full farmer-btn"
            onClick={() => sendMutation.mutate()}
            disabled={
              sendMutation.isPending || !phone.trim() || !message.trim()
            }
            data-testid="button-send-sms"
          >
            <Send size={16} className="mr-2" />
            {sendMutation.isPending
              ? language === "te"
                ? "పంపుతోంది..."
                : language === "hi"
                  ? "भेज रहे हैं..."
                  : "Sending..."
              : tx.sendAlert}
          </Button>
        </CardContent>
      </Card>

      {/* Sent Alerts History */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            {language === "te"
              ? "పంపిన హెచ్చరికలు"
              : language === "hi"
                ? "भेजे गए अलर्ट"
                : "Sent Alerts"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-16 bg-muted rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : alerts && alerts.length > 0 ? (
            <div className="space-y-2">
              {alerts.slice(0, 10).map((alert) => (
                <div
                  key={alert.id}
                  className="border rounded-lg p-3 flex gap-3"
                >
                  <div className="mt-0.5">
                    {alert.status === "sent" ? (
                      <CheckCircle2 size={16} className="text-green-500" />
                    ) : (
                      <XCircle size={16} className="text-red-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-muted-foreground">
                        {alert.phoneNumber}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-xs px-1.5 py-0 capitalize"
                      >
                        {typeLabel[alert.type] || alert.type}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-xs px-1.5 py-0 ml-auto ${
                          alert.status === "sent"
                            ? "border-green-400 text-green-600"
                            : "border-red-400 text-red-600"
                        }`}
                      >
                        {alert.status === "sent"
                          ? language === "te"
                            ? "పంపబడింది"
                            : language === "hi"
                              ? "भेजा"
                              : "Sent"
                          : language === "te"
                            ? "విఫలం"
                            : language === "hi"
                              ? "असफल"
                              : "Failed"}
                      </Badge>
                    </div>
                    <p className="text-xs line-clamp-2">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-1 opacity-60">
                      {new Date(alert.createdAt).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              {tx.noData}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
