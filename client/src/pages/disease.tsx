import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Upload, Mic, MicOff, Volume2, VolumeX, Send, AlertTriangle, Leaf, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/language";
import { useVoice } from "@/hooks/useVoice";
import { apiRequest } from "@/lib/queryClient";
import type { Language } from "@/lib/language";

interface DiseaseResult {
  id: number;
  diseaseName: string;
  severity: string;
  solution: string;
  actionPlan: string;
  spreadInfo: string;
  medicineName: string;
}

interface DiseaseProps {
  language: Language;
}

export default function Disease({ language }: DiseaseProps) {
  const tx = useTranslation(language);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isListening, isSpeaking, startListening, stopListening, speak, stopSpeaking } = useVoice(language);

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [cropName, setCropName] = useState("");
  const [result, setResult] = useState<DiseaseResult | null>(null);
  const [neighborPhones, setNeighborPhones] = useState("");
  const [showNeighborForm, setShowNeighborForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("language", language);
      if (selectedImage) {
        formData.append("image", selectedImage);
      } else {
        formData.append("cropName", cropName);
      }
      const res = await fetch("/api/disease-detect", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Analysis failed");
      return res.json();
    },
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/disease-detections"] });
      if (data.diseaseName !== "Healthy Crop") {
        setShowNeighborForm(true);
      }
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to analyze. Please try again.", variant: "destructive" });
    },
  });

  const smsMutation = useMutation({
    mutationFn: async () => {
      const phones = neighborPhones.split(",").map((p) => p.trim()).filter(Boolean);
      const message = `KrishiHealth Alert: ${result?.diseaseName} detected (${result?.severity}). ${result?.solution?.slice(0, 100)}...`;
      const res = await apiRequest("POST", "/api/sms/send-group", { phoneNumbers: phones, message, type: "disease" });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "SMS Sent!", description: "Neighbors have been alerted." });
      setShowNeighborForm(false);
      setNeighborPhones("");
    },
    onError: () => {
      toast({ title: "SMS Failed", description: "Could not send alerts.", variant: "destructive" });
    },
  });

  function handleImageSelect(file: File) {
    setSelectedImage(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
    setResult(null);
  }

  function handleVoiceInput() {
    if (isListening) {
      stopListening();
    } else {
      startListening((text) => setCropName(text));
    }
  }

  function speakResult() {
    if (!result) return;
    if (isSpeaking) {
      stopSpeaking();
    } else {
      const text = `${result.diseaseName}. ${result.solution}`;
      speak(text);
    }
  }

  const severityColor = {
    mild: "border-green-400 text-green-700 bg-green-50 dark:bg-green-950/30 dark:text-green-300",
    moderate: "border-yellow-400 text-yellow-700 bg-yellow-50 dark:bg-yellow-950/30 dark:text-yellow-300",
    severe: "border-red-400 text-red-700 bg-red-50 dark:bg-red-950/30 dark:text-red-300",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Leaf className="text-primary" size={22} />
        <h2 className="text-xl font-bold">{tx.detectDisease}</h2>
      </div>

      {/* Image Upload Card */}
      <Card>
        <CardContent className="p-4 space-y-3">
          {imagePreview ? (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Crop"
                className="w-full rounded-lg max-h-64 object-cover"
                data-testid="img-crop-preview"
              />
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => { setImagePreview(null); setSelectedImage(null); setResult(null); }}
              >
                ✕
              </Button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center space-y-3">
              <Leaf className="mx-auto text-muted-foreground" size={40} />
              <p className="text-sm text-muted-foreground">{tx.uploadPhoto}</p>
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  className="farmer-btn"
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="button-upload-photo"
                >
                  <Upload size={18} className="mr-2" /> {tx.uploadPhoto}
                </Button>
                <Button
                  variant="outline"
                  className="farmer-btn"
                  onClick={() => cameraInputRef.current?.click()}
                  data-testid="button-take-photo"
                >
                  <Camera size={18} className="mr-2" /> {tx.takePhoto}
                </Button>
              </div>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleImageSelect(e.target.files[0])}
          />
          <input
            type="file"
            ref={cameraInputRef}
            className="hidden"
            accept="image/*"
            capture="environment"
            onChange={(e) => e.target.files?.[0] && handleImageSelect(e.target.files[0])}
          />

          {/* Text input */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{tx.orDescribe}</Label>
            <div className="flex gap-2">
              <Input
                placeholder={tx.cropName}
                value={cropName}
                onChange={(e) => setCropName(e.target.value)}
                className="flex-1"
                data-testid="input-crop-name"
              />
              <Button
                variant="outline"
                size="icon"
                className={`h-10 w-10 ${isListening ? "border-red-400 bg-red-50 dark:bg-red-950/30 recording-pulse" : ""}`}
                onClick={handleVoiceInput}
                data-testid="button-voice-input"
              >
                {isListening ? <MicOff size={18} className="text-red-500" /> : <Mic size={18} />}
              </Button>
            </div>
          </div>

          <Button
            className="w-full farmer-btn"
            onClick={() => analyzeMutation.mutate()}
            disabled={analyzeMutation.isPending || (!selectedImage && !cropName.trim())}
            data-testid="button-analyze"
          >
            {analyzeMutation.isPending ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⟳</span> {tx.analyzing}
              </span>
            ) : (
              tx.analyze
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Result */}
      {result && (
        <Card className="border-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                {result.diseaseName === "Healthy Crop" ? (
                  <span className="text-green-500">✓</span>
                ) : (
                  <AlertTriangle className="text-yellow-500" size={18} />
                )}
                {result.diseaseName}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={`capitalize text-xs ${severityColor[result.severity as keyof typeof severityColor] || ""}`}
                  data-testid="badge-severity"
                >
                  {result.severity}
                </Badge>
                <Button variant="ghost" size="icon" onClick={speakResult} data-testid="button-speak-result">
                  {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Medicine */}
            {result.medicineName && (
              <div className="bg-primary/10 rounded-lg p-3">
                <p className="text-xs font-semibold text-primary uppercase mb-1">{tx.medicine}</p>
                <p className="text-sm font-medium">{result.medicineName}</p>
              </div>
            )}

            {/* Solution */}
            <div>
              <p className="text-xs font-semibold uppercase mb-1 text-muted-foreground">{tx.solution}</p>
              <p className="text-sm leading-relaxed">{result.solution}</p>
            </div>

            {/* Action Plan */}
            {result.actionPlan && (
              <div>
                <p className="text-xs font-semibold uppercase mb-2 text-muted-foreground">{tx.actionPlan}</p>
                <div className="space-y-2">
                  {result.actionPlan.split("\n").filter(Boolean).map((line, i) => (
                    <div key={i} className="flex gap-2 items-start bg-muted/40 rounded-lg p-2">
                      <span className="text-primary font-bold text-xs mt-0.5 shrink-0">
                        {i === 0 ? "0-6h" : i === 1 ? "6-24h" : "24-48h"}
                      </span>
                      <span className="text-xs">{line.replace(/^Hour \d+-\d+:\s*/, "")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Spread Info */}
            {result.spreadInfo && (
              <div>
                <p className="text-xs font-semibold uppercase mb-1 text-muted-foreground">{tx.spreadInfo}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{result.spreadInfo}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Neighbor Alert */}
      {showNeighborForm && result && (
        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="text-orange-500" size={18} />
              {tx.alertNeighbors}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder={tx.phoneNumbers}
              value={neighborPhones}
              onChange={(e) => setNeighborPhones(e.target.value)}
              rows={2}
              data-testid="textarea-neighbor-phones"
            />
            <div className="flex gap-2">
              <Button
                className="farmer-btn flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                onClick={() => smsMutation.mutate()}
                disabled={smsMutation.isPending || !neighborPhones.trim()}
                data-testid="button-send-neighbor-sms"
              >
                <Send size={16} className="mr-2" />
                {smsMutation.isPending ? tx.sending : tx.sendSMS}
              </Button>
              <Button variant="outline" onClick={() => setShowNeighborForm(false)}>
                ✕
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
