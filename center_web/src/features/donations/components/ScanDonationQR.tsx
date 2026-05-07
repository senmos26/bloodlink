"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  QrCode,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  RotateCcw,
  Droplets,
  User,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Keyboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useVerifyDonationQR } from "@/features/donations/lib/hooks";
import { cn } from "@/lib/utils";

interface QRData {
  donor_id: string;
  timestamp: number;
}

type ScanState = "idle" | "scanning" | "verifying" | "success" | "error";

export function ScanDonationQR() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animRef = useRef<number | null>(null);

  const [state, setState] = useState<ScanState>("idle");
  const [mode, setMode] = useState<"camera" | "manual">("camera");
  const [manualDonorId, setManualDonorId] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    success: boolean;
    donor?: { full_name: string; blood_type: string };
    error?: string;
    message?: string;
  } | null>(null);

  const verifyMutation = useVerifyDonationQR();

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
  }, []);

  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !streamRef.current) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    import("jsqr").then((jsqr) => {
      const code = jsqr.default(imageData.data, imageData.width, imageData.height);
      if (code && state === "scanning") {
        try {
          const qrData: QRData = JSON.parse(code.data);
          if (qrData.donor_id && qrData.timestamp) {
            handleVerify(qrData);
            return;
          }
        } catch {
          // Invalid QR, keep scanning
        }
      }
      if (state === "scanning") {
        animRef.current = requestAnimationFrame(scanFrame);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      streamRef.current = mediaStream;
      setState("scanning");
      setCameraError(null);
    } catch {
      setCameraError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
      setState("idle");
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  useEffect(() => {
    if (state === "scanning" && videoRef.current && videoRef.current.readyState >= 2) {
      animRef.current = requestAnimationFrame(scanFrame);
    }
  }, [state, scanFrame]);

  const handleVerify = async (qrData: QRData) => {
    stopCamera();
    setState("verifying");

    const res = await verifyMutation.mutateAsync({
      donorId: qrData.donor_id,
      timestamp: qrData.timestamp,
    });

    setResult(res);
    setState(res.success ? "success" : "error");
  };

  const handleRestart = () => {
    setResult(null);
    setState("idle");
    setManualDonorId("");
    if (mode === "camera") startCamera();
  };

  const handleManualVerify = () => {
    if (!manualDonorId.trim()) return;
    setState("verifying");
    stopCamera();
    verifyMutation.mutateAsync({
      donorId: manualDonorId.trim(),
      timestamp: Date.now(),
    }).then((res) => {
      setResult(res);
      setState(res.success ? "success" : "error");
    });
  };

  const isScanning = state === "scanning";
  const isVerifying = state === "verifying";
  const isSuccess = state === "success";
  const isError = state === "error";

  return (
    <div className="flex flex-col h-full -mx-4 sm:-mx-6">
      {/* Header */}
      <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => router.push("/donations")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <QrCode className="h-5 w-5 text-rose-600" />
              Scanner un donneur
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Scannez le QR code du donneur pour valider le don
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6 space-y-4">
        {/* Mode toggle */}
        {(state === "idle" || isScanning) && (
          <div className="flex gap-2">
            <Button
              variant={mode === "camera" ? "default" : "outline"}
              size="sm"
              className={cn("gap-1.5", mode === "camera" && "bg-rose-600 hover:bg-rose-700")}
              onClick={() => { setMode("camera"); startCamera(); }}
            >
              <QrCode className="h-3.5 w-3.5" /> Caméra
            </Button>
            <Button
              variant={mode === "manual" ? "default" : "outline"}
              size="sm"
              className={cn("gap-1.5", mode === "manual" && "bg-rose-600 hover:bg-rose-700")}
              onClick={() => { setMode("manual"); stopCamera(); setState("idle"); }}
            >
              <Keyboard className="h-3.5 w-3.5" /> Saisie manuelle
            </Button>
          </div>
        )}

        {/* Manual input mode */}
        {mode === "manual" && (state === "idle" || isScanning) && (
          <Card className="border-slate-200">
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  ID du donneur
                </label>
                <Input
                  placeholder="Collez l'UUID du donneur ici..."
                  value={manualDonorId}
                  onChange={(e) => setManualDonorId(e.target.value)}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-slate-500">
                  Mode test : copiez le QR data depuis l'app mobile et collez le <code className="bg-slate-100 px-1 rounded">donor_id</code>
                </p>
              </div>
              <Button
                className="w-full bg-rose-600 hover:bg-rose-700 gap-2"
                onClick={handleManualVerify}
                disabled={!manualDonorId.trim()}
              >
                <ShieldCheck className="h-4 w-4" />
                Vérifier et valider le don
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Camera / Scanner */}
        {mode === "camera" && (isScanning || state === "idle") && !cameraError && (
          <div className="relative bg-slate-950 rounded-2xl overflow-hidden max-w-md mx-auto" style={{ aspectRatio: "4/3" }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              onLoadedMetadata={() => {
                if (isScanning) {
                  animRef.current = requestAnimationFrame(scanFrame);
                }
              }}
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Scan overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 bg-black/40">
                {/* Center cutout */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-56 h-56 sm:w-64 sm:h-64 relative">
                    {/* Corner brackets */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-3 border-l-3 border-rose-400 rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-3 border-r-3 border-rose-400 rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-3 border-l-3 border-rose-400 rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-3 border-r-3 border-rose-400 rounded-br-lg" />

                    {/* Scan line animation */}
                    {isScanning && (
                      <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-rose-400 to-transparent animate-scan-line" />
                    )}
                  </div>
                </div>
              </div>

              {/* Status pill */}
              {isScanning && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    Scan en cours...
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Camera error */}
        {mode === "camera" && cameraError && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="flex items-center gap-3 p-4">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
              <p className="text-sm text-destructive">{cameraError}</p>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        {mode === "camera" && isScanning && (
          <Card className="border-slate-200 bg-slate-50/80">
            <CardContent className="p-4 space-y-2">
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Instructions
              </p>
              <ul className="space-y-1.5 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                  Demandez au donneur d&apos;ouvrir son QR dans l&apos;application mobile
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                  Placez le code dans le cadre rouge
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xs font-bold shrink-0">3</span>
                  La validation se fait automatiquement
                </li>
              </ul>
              <div className="flex items-center gap-2 pt-1">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs text-slate-500">Le QR est valide 10 minutes après génération</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Verifying state */}
        {isVerifying && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-rose-200 border-t-rose-600 animate-spin" />
              <ShieldCheck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-rose-600" />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-slate-900">Vérification en cours...</p>
              <p className="text-sm text-slate-500 mt-1">Validation de l&apos;éligibilité du donneur</p>
            </div>
          </div>
        )}

        {/* Success result */}
        {isSuccess && result && (
          <div className="space-y-4">
            <Card className="border-emerald-200 bg-emerald-50/80 overflow-hidden">
              <div className="bg-emerald-600 px-4 py-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-white" />
                <span className="text-white font-bold text-sm">Don validé avec succès</span>
              </div>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                    <User className="h-6 w-6 text-emerald-700" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">
                      {result.donor?.full_name ?? "Donneur"}
                    </p>
                    <Badge className="mt-1 bg-rose-100 text-rose-700 border-rose-200 border text-xs font-bold">
                      <Droplets className="h-3 w-3 mr-1" />
                      {result.donor?.blood_type ?? "—"}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-white rounded-lg p-2.5 border border-emerald-100">
                    <p className="text-xs text-slate-500">Date du don</p>
                    <p className="font-semibold text-slate-900">
                      {new Date().toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-2.5 border border-emerald-100">
                    <p className="text-xs text-slate-500">Volume</p>
                    <p className="font-semibold text-slate-900">450 mL</p>
                  </div>
                </div>

                {result.message && (
                  <p className="text-xs text-emerald-700 bg-emerald-100 rounded-lg p-2">
                    {result.message}
                  </p>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                className="flex-1 bg-rose-600 hover:bg-rose-700"
                onClick={handleRestart}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Scanner un autre
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => router.push("/donations")}
              >
                <Droplets className="h-4 w-4 mr-2" />
                Voir les dons
              </Button>
            </div>
          </div>
        )}

        {/* Error result */}
        {isError && result && (
          <div className="space-y-4">
            <Card className="border-destructive/30 bg-destructive/5 overflow-hidden">
              <div className="bg-destructive px-4 py-3 flex items-center gap-2">
                <XCircle className="h-5 w-5 text-white" />
                <span className="text-white font-bold text-sm">Échec de la validation</span>
              </div>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-destructive">
                      {result.error ?? "Erreur inconnue"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Vérifiez que le QR code est récent et que le donneur est éligible.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                className="flex-1 bg-rose-600 hover:bg-rose-700"
                onClick={handleRestart}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Réessayer
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => router.push("/donations")}
              >
                Retour aux dons
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
