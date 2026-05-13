"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface QRData {
  donor_id: string;
  timestamp: number;
}

interface VerificationResult {
  success: boolean;
  donor?: {
    full_name: string;
    blood_type: string;
  };
  error?: string;
  message?: string;
}

export default function ScanQRPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);

  async function startCamera() {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      setStream(mediaStream);
      setIsScanning(true);
      setError(null);
    } catch (err) {
      console.error("Erreur d'accès à la caméra:", err);
      setError("Impossible d'accéder à la caméra. Veuillez vérifier les permissions.");
    }
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setIsScanning(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    startCamera();
    
    return () => {
      stopCamera();
    };
  }, []);

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    
    // Importer jsQR dynamiquement pour éviter les erreurs SSR
    import("jsqr").then((jsqr) => {
      const code = jsqr.default(imageData.data, imageData.width, imageData.height);
      
      if (code) {
        try {
          const qrData: QRData = JSON.parse(code.data);
          verifyQRCode(qrData);
        } catch (err) {
          console.error("QR code invalide:", err);
        }
      } else {
        // Continuer le scan
        animationRef.current = requestAnimationFrame(scanQRCode);
      }
    }).catch(err => {
      console.error("Erreur lors de l'import de jsQR:", err);
    });
  };

  const verifyQRCode = async (qrData: QRData) => {
    setIsLoading(true);
    stopCamera();

    try {
      const response = await fetch("/api/verify-donation-qr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(qrData),
      });

      const data: VerificationResult = await response.json();
      setResult(data);

      if (data.success) {
        // Succès - afficher le résultat
        setTimeout(() => {
          // Optionnel: rediriger ou réinitialiser après quelques secondes
        }, 5000);
      }
    } catch (err) {
      console.error("Erreur de vérification:", err);
      setResult({
        success: false,
        error: "Erreur de connexion au serveur",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestart = () => {
    setResult(null);
    setError(null);
    startCamera();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-red-600 text-white p-6">
            <h1 className="text-2xl font-bold">Scanner QR Code de Don</h1>
            <p className="mt-2 text-red-100">
              Scannez le QR code présenté par le donneur pour valider le don
            </p>
          </div>

          {/* Scanner Section */}
          <div className="p-6">
            {!result && !isLoading && (
              <div className="space-y-4">
                <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: "4/3" }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    onLoadedMetadata={() => {
                      if (isScanning) {
                        scanQRCode();
                      }
                    }}
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {/* Overlay de scan */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 bg-black bg-opacity-30">
                      <div className="absolute inset-4 border-2 border-green-400 rounded-lg">
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-lg"></div>
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-lg"></div>
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-lg"></div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-lg"></div>
                      </div>
                    </div>
                    
                    {isScanning && (
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-full flex items-center gap-2">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        <span className="text-sm">Recherche du QR code...</span>
                      </div>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span className="text-red-700">{error}</span>
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="text-sm text-blue-700">
                      <p className="font-semibold mb-1">Instructions:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Positionnez le QR code du donneur dans le cadre</li>
                        <li>Assurez-vous que le code est bien visible et net</li>
                        <li>La validation se fera automatiquement</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                <p className="mt-4 text-gray-600">Vérification du QR code...</p>
              </div>
            )}

            {/* Result Section */}
            {result && !isLoading && (
              <div className="space-y-6">
                {result.success ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <h2 className="text-xl font-bold text-green-800">Don Validé avec Succès!</h2>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-green-200">
                        <span className="font-medium text-gray-700">Nom du donneur:</span>
                        <span className="font-semibold text-gray-900">{result.donor?.full_name}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-green-200">
                        <span className="font-medium text-gray-700">Groupe sanguin:</span>
                        <span className="font-semibold text-gray-900">{result.donor?.blood_type}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="font-medium text-gray-700">Date du don:</span>
                        <span className="font-semibold text-gray-900">{new Date().toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>

                    {result.message && (
                      <div className="mt-4 p-3 bg-green-100 rounded-lg">
                        <p className="text-sm text-green-700">{result.message}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <h2 className="text-xl font-bold text-red-800">Échec de la Validation</h2>
                    </div>
                    
                    <div className="bg-red-100 rounded-lg p-4">
                      <p className="text-red-700">{result.error || "Erreur inconnue"}</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    onClick={handleRestart}
                    className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                  >
                    Scanner un autre QR Code
                  </button>
                  <button
                    onClick={() => router.push("/admin/dashboard")}
                    className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Retour au Tableau de Bord
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
