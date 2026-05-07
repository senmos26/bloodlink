import { NextRequest, NextResponse } from "next/server";

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

export async function POST(request: NextRequest) {
  try {
    const body: QRData = await request.json();
    
    // Validation des données d'entrée
    if (!body.donor_id || !body.timestamp) {
      return NextResponse.json<VerificationResult>({
        success: false,
        error: "Données QR code invalides",
      }, { status: 400 });
    }

    // Vérification 1: timestamp < 10 minutes
    const now = Date.now();
    const tenMinutesInMs = 10 * 60 * 1000;
    if (now - body.timestamp > tenMinutesInMs) {
      return NextResponse.json<VerificationResult>({
        success: false,
        error: "QR code expiré. Veuillez demander un nouveau QR code au donneur.",
      }, { status: 400 });
    }

    // Appel à l'Edge Function Supabase pour la vérification
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json<VerificationResult>({
        success: false,
        error: "Configuration serveur manquante",
      }, { status: 500 });
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/verify-donation-qr`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json<VerificationResult>({
        success: false,
        error: data.error || "Erreur lors de la vérification du don",
      }, { status: response.status });
    }

    return NextResponse.json<VerificationResult>(data);

  } catch (error) {
    console.error("Erreur dans l'API route verify-donation-qr:", error);
    return NextResponse.json<VerificationResult>({
      success: false,
      error: "Erreur serveur interne",
    }, { status: 500 });
  }
}
