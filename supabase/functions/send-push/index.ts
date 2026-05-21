import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

Deno.serve(async (req) => {
  // Gérer CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("Variables d'environnement Supabase manquantes.");
      return jsonResponse({ error: "Configuration serveur incorrecte." }, 500);
    }

    // Créer le client Supabase avec la clé service_role pour outrepasser RLS
    const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Récupérer de manière dynamique le secret du webhook depuis la table sécurisée public.app_settings
    const { data: secretData, error: secretError } = await serviceClient
      .from("app_settings")
      .select("value")
      .eq("key", "webhook_secret")
      .single();

    if (secretError || !secretData?.value) {
      console.error("Impossible de récupérer le secret de webhook dans la base de données:", secretError);
      return jsonResponse({ error: "Configuration de sécurité manquante sur le serveur." }, 500);
    }

    const webhookSecret = secretData.value;

    // Vérifier l'autorisation (Bearer Token)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || authHeader !== `Bearer ${webhookSecret}`) {
      console.warn("Tentative d'accès non autorisée rejetée.");
      return jsonResponse({ error: "Accès non autorisé." }, 401);
    }

    // Lire le corps de la requête
    const payload = await req.json().catch(() => null);
    if (!payload || payload.table !== "alerts" || payload.type !== "INSERT") {
      return jsonResponse({ error: "Payload webhook invalide ou non supporté." }, 400);
    }

    const record = payload.record;
    if (!record || !record.id) {
      return jsonResponse({ error: "ID de l'alerte manquant dans le payload." }, 400);
    }

    console.log(`[send-push] Traitement de la nouvelle alerte: ${record.id}`);

    // Récupérer le nom du centre
    const { data: center } = await serviceClient
      .from("centers")
      .select("name")
      .eq("id", record.center_id)
      .single();
    const centerName = center?.name || "un centre de transfusion";

    // Récupérer les donneurs compatibles
    const { data: donors, error: rpcError } = await serviceClient.rpc(
      "get_compatible_donors_for_alert",
      { p_alert_id: record.id }
    );

    if (rpcError) {
      console.error("Erreur lors de la récupération des donneurs compatibles:", rpcError);
      return jsonResponse({ error: "Erreur lors de la sélection des donneurs.", details: rpcError.message }, 500);
    }

    const matchedCount = donors?.length || 0;
    console.log(`[send-push] ${matchedCount} donneurs compatibles trouvés.`);

    if (matchedCount === 0) {
      return jsonResponse({
        success: true,
        message: "Aucun donneur compatible trouvé dans le rayon de l'alerte.",
        donorsMatched: 0,
        pushNotificationsSent: 0,
      });
    }

    // Préparer les textes des notifications
    const title = `🚨 Urgence Sang - Groupe ${record.blood_type_required}`;
    const urgencyText = record.urgency_level === 'critical' ? 'CRITIQUE' : (record.urgency_level === 'high' ? 'ÉLEVÉE' : 'NORMALE');
    const baseBody = `${centerName} signale un besoin urgent en groupe ${record.blood_type_required} (Urgence ${urgencyText}).`;
    const body = record.message ? `${baseBody} "${record.message}"` : baseBody;

    // 1. Insertion en masse des notifications in-app
    const inAppNotifications = donors.map((donor: any) => ({
      user_id: donor.user_id,
      title,
      body,
      type: "alert",
      data: {
        alert_id: record.id,
        center_id: record.center_id,
        distance_km: donor.distance_km,
      },
    }));

    const { error: insertError } = await serviceClient
      .from("notifications")
      .insert(inAppNotifications);

    if (insertError) {
      console.error("Erreur lors de l'insertion des notifications in-app:", insertError);
    } else {
      console.log(`[send-push] ${inAppNotifications.length} notifications in-app créées avec succès.`);
    }

    // 2. Envoi des notifications push via Expo (uniquement aux donneurs avec token Expo)
    const pushTargets = donors.filter(
      (d: any) =>
        d.fcm_token &&
        (d.fcm_token.trim().startsWith("ExponentPushToken") ||
          d.fcm_token.trim().startsWith("ExpoPushToken"))
    );
    const pushCount = pushTargets.length;
    console.log(`[send-push] ${pushCount} donneurs cibles pour notification push.`);

    const results = [];
    if (pushCount > 0) {
      // Découpage en lots de 100 (limite de l'API Expo)
      const chunkSize = 100;
      const chunks = [];
      for (let i = 0; i < pushCount; i += chunkSize) {
        chunks.push(pushTargets.slice(i, i + chunkSize));
      }

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const pushMessages = chunk.map((donor: any) => ({
          to: donor.fcm_token,
          title,
          body,
          sound: "default",
          channelId: "default",
          priority: "high",
          data: {
            type: "alert",
            alertId: record.id,
            centerId: record.center_id,
            sentAt: new Date().toISOString(),
            source: "send-push",
          },
        }));

        try {
          console.log(`[send-push] Envoi du lot ${i + 1}/${chunks.length} (${chunk.length} messages) à Expo...`);
          const expoResponse = await fetch("https://exp.host/--/api/v2/push/send", {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Accept-encoding": "gzip, deflate",
              "Content-Type": "application/json",
            },
            body: JSON.stringify(pushMessages),
          });

          const data = await expoResponse.json();
          results.push({
            batch: i + 1,
            status: expoResponse.status,
            data,
          });
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          console.error(`[send-push] Erreur envoi lot ${i + 1}:`, errMsg);
          results.push({
            batch: i + 1,
            error: errMsg,
          });
        }
      }
    }

    return jsonResponse({
      success: true,
      message: "Traitement de l'alerte terminé avec succès.",
      donorsMatched: matchedCount,
      pushNotificationsSent: pushCount,
      batches: results,
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur interne inconnue";
    console.error("[send-push] Erreur fatale dans Deno serve:", message);
    return jsonResponse({ error: message }, 500);
  }
});
