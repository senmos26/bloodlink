import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type NotificationType = "alert" | "appointment" | "donation" | "system";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function normalizeType(value: unknown): NotificationType {
  if (value === "alert" || value === "appointment" || value === "donation") {
    return value;
  }
  return "system";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      return jsonResponse({ error: "Missing Supabase environment variables." }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Missing authorization header." }, 401);
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ error: "Invalid user session." }, 401);
    }

    const payload = await req.json().catch(() => ({}));
    const title = typeof payload?.title === "string" && payload.title.trim()
      ? payload.title.trim().slice(0, 200)
      : "Test push BloodLink";
    const body = typeof payload?.body === "string" && payload.body.trim()
      ? payload.body.trim()
      : "Si tu vois ceci, la vraie push distante fonctionne.";
    const type = normalizeType(payload?.type);

    const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { data: profile, error: profileError } = await serviceClient
      .from("profiles")
      .select("fcm_token, device_platform")
      .eq("id", user.id)
      .single();

    if (profileError) {
      return jsonResponse({ error: "Unable to load user push profile.", details: profileError.message }, 500);
    }

    if (!profile?.fcm_token) {
      return jsonResponse(
        {
          error: "No push token registered for this user.",
          hint: "Open the app in a development build, grant notification permission, and reconnect.",
        },
        400,
      );
    }

    const expoResponse = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: profile.fcm_token,
        title,
        body,
        sound: "default",
        channelId: "default",
        priority: "high",
        data: {
          type,
          sentAt: new Date().toISOString(),
          source: "send-test-push",
        },
      }),
    });

    const expoJson = await expoResponse.json().catch(() => null);

    if (!expoResponse.ok) {
      return jsonResponse(
        {
          error: "Expo push API request failed.",
          details: expoJson,
        },
        502,
      );
    }

    await serviceClient.from("notifications").insert({
      user_id: user.id,
      title,
      body,
      type,
      data: {
        source: "send-test-push",
        expo: expoJson,
      },
    });

    return jsonResponse({
      success: true,
      platform: profile.device_platform ?? null,
      expo: expoJson,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return jsonResponse({ error: message }, 500);
  }
});
