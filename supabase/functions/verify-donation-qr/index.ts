import { serve } from "jsr:@std/http/server";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Créer le client Supabase avec la service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parser le corps de la requête
    const body: QRData = await req.json();
    
    // Validation des données d'entrée
    if (!body.donor_id || !body.timestamp) {
      return new Response<VerificationResult>(
        JSON.stringify({
          success: false,
          error: "Données QR code invalides",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Vérification 1: timestamp < 10 minutes
    const now = Date.now();
    const tenMinutesInMs = 10 * 60 * 1000;
    if (now - body.timestamp > tenMinutesInMs) {
      return new Response<VerificationResult>(
        JSON.stringify({
          success: false,
          error: "QR code expiré. Veuillez demander un nouveau QR code au donneur.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Vérification 2: le donneur existe et is_active = true
    const { data: donor, error: donorError } = await supabase
      .from("profiles")
      .select("id, full_name, blood_type, is_active, next_donation_date")
      .eq("id", body.donor_id)
      .single();

    if (donorError || !donor) {
      return new Response<VerificationResult>(
        JSON.stringify({
          success: false,
          error: "Donneur non trouvé",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        }
      );
    }

    if (!donor.is_active) {
      return new Response<VerificationResult>(
        JSON.stringify({
          success: false,
          error: "Compte donneur désactivé",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        }
      );
    }

    // Vérification 3: next_donation_date est null ou dans le passé
    if (donor.next_donation_date) {
      const nextDonationDate = new Date(donor.next_donation_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (nextDonationDate > today) {
        const daysUntil = Math.ceil((nextDonationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return new Response<VerificationResult>(
          JSON.stringify({
            success: false,
            error: `Le donneur n'est pas éligible. Prochain don possible dans ${daysUntil} jours.`,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 403,
          }
        );
      }
    }

    // Récupérer l'ID du centre de l'admin qui fait la demande
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response<VerificationResult>(
        JSON.stringify({
          success: false,
          error: "Authentification requise",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response<VerificationResult>(
        JSON.stringify({
          success: false,
          error: "Token d'authentification invalide",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    // Récupérer le centre de l'admin
    const { data: adminProfile, error: adminError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (adminError || !adminProfile) {
      return new Response<VerificationResult>(
        JSON.stringify({
          success: false,
          error: "Profil admin non trouvé",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        }
      );
    }

    // Vérifier que l'utilisateur est un admin
    if (adminProfile.role !== "center_admin" && adminProfile.role !== "super_admin") {
      return new Response<VerificationResult>(
        JSON.stringify({
          success: false,
          error: "Permissions insuffisantes",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        }
      );
    }

    // Récupérer le centre de l'admin (pour center_admin) ou utiliser le premier centre (pour super_admin)
    let centerId: string;
    
    if (adminProfile.role === "center_admin") {
      const { data: center, error: centerError } = await supabase
        .from("centers")
        .select("id")
        .eq("admin_id", user.id)
        .single();

      if (centerError || !center) {
        return new Response<VerificationResult>(
          JSON.stringify({
            success: false,
            error: "Centre non trouvé pour cet admin",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 404,
          }
        );
      }
      centerId = center.id;
    } else {
      // Pour super_admin, on utilise le premier centre actif
      const { data: center, error: centerError } = await supabase
        .from("centers")
        .select("id")
        .eq("is_active", true)
        .limit(1)
        .single();

      if (centerError || !center) {
        return new Response<VerificationResult>(
          JSON.stringify({
            success: false,
            error: "Aucun centre actif trouvé",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 404,
          }
        );
      }
      centerId = center.id;
    }

    // Si tout est valide, insérer le don
    const { data: donation, error: donationError } = await supabase
      .from("donations")
      .insert({
        donor_id: body.donor_id,
        center_id: centerId,
        donation_date: new Date().toISOString(),
        volume_ml: 450,
        status: "validated",
        validated_by: user.id,
        validated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (donationError) {
      console.error("Erreur insertion don:", donationError);
      return new Response<VerificationResult>(
        JSON.stringify({
          success: false,
          error: "Erreur lors de l'enregistrement du don",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Mettre à jour next_donation_date = aujourd'hui + 56 jours
    const nextDonationDate = new Date();
    nextDonationDate.setDate(nextDonationDate.getDate() + 56);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        next_donation_date: nextDonationDate.toISOString().split('T')[0],
      })
      .eq("id", body.donor_id);

    if (updateError) {
      console.error("Erreur mise à jour next_donation_date:", updateError);
      // On ne fait pas échouer la transaction si cette mise à jour échoue
    }

    // Créer une notification pour le donneur
    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        user_id: body.donor_id,
        title: "Don validé",
        body: "Merci pour votre don! Votre prochain don sera possible le " + nextDonationDate.toLocaleDateString('fr-FR'),
        type: "donation",
        data: {
          donation_id: donation.id,
          center_id: centerId,
        },
      });

    if (notificationError) {
      console.error("Erreur création notification:", notificationError);
      // On ne fait pas échouer la transaction si cette création échoue
    }

    // Retourner le succès
    return new Response<VerificationResult>(
      JSON.stringify({
        success: true,
        donor: {
          full_name: donor.full_name,
          blood_type: donor.blood_type || "Non défini",
        },
        message: `Don de ${donor.blood_type || 'groupe inconnu'} enregistré avec succès. Prochain don possible le ${nextDonationDate.toLocaleDateString('fr-FR')}.`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Erreur dans verify-donation-qr:", error);
    return new Response<VerificationResult>(
      JSON.stringify({
        success: false,
        error: "Erreur serveur interne",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
