import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

type CreateCenterAccountPayload = {
  responsibleFullName: string;
  responsibleEmail: string;
  responsiblePhone: string;
  temporaryPassword: string;
  centerName: string;
  centerAddress: string;
  centerCity: string;
  centerPhone: string;
  centerEmail: string;
  latitude: number;
  longitude: number;
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders,
  });
}

function validatePayload(payload: Partial<CreateCenterAccountPayload>) {
  const stringFields: Array<keyof Omit<CreateCenterAccountPayload, "latitude" | "longitude">> = [
    "responsibleFullName",
    "responsibleEmail",
    "responsiblePhone",
    "temporaryPassword",
    "centerName",
    "centerAddress",
    "centerCity",
    "centerPhone",
    "centerEmail",
  ];

  for (const field of stringFields) {
    if (typeof payload[field] !== "string" || payload[field]?.trim().length === 0) {
      throw new Error(`Champ invalide: ${field}`);
    }
  }

  if (typeof payload.latitude !== "number" || Number.isNaN(payload.latitude)) {
    throw new Error("Champ invalide: latitude");
  }

  if (typeof payload.longitude !== "number" || Number.isNaN(payload.longitude)) {
    throw new Error("Champ invalide: longitude");
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return jsonResponse({ error: "Missing Supabase environment variables." }, 500);
  }

  const authorization = request.headers.get("Authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return jsonResponse({ error: "Missing bearer token." }, 401);
  }

  const token = authorization.replace("Bearer ", "").trim();

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  try {
    const { data: authData, error: authError } = await userClient.auth.getUser();

    if (authError || !authData.user) {
      return jsonResponse({ error: "Unauthorized." }, 401);
    }

    const { data: callerProfile, error: profileError } = await userClient
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .single();

    if (profileError || !callerProfile) {
      return jsonResponse({ error: "Caller profile not found." }, 403);
    }

    if (callerProfile.role !== "super_admin") {
      return jsonResponse({ error: "Forbidden." }, 403);
    }

    const payload = (await request.json()) as Partial<CreateCenterAccountPayload>;
    validatePayload(payload);

    const {
      responsibleFullName,
      responsibleEmail,
      responsiblePhone,
      temporaryPassword,
      centerName,
      centerAddress,
      centerCity,
      centerPhone,
      centerEmail,
      latitude,
      longitude,
    } = payload as CreateCenterAccountPayload;

    const { data: createdUser, error: createUserError } =
      await adminClient.auth.admin.createUser({
        email: responsibleEmail.trim().toLowerCase(),
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: {
          full_name: responsibleFullName.trim(),
          phone: responsiblePhone.trim(),
        },
      });

    if (createUserError || !createdUser.user) {
      return jsonResponse({ error: createUserError?.message ?? "Unable to create user." }, 400);
    }

    const userId = createdUser.user.id;

    const { error: updateProfileError } = await adminClient
      .from("profiles")
      .update({
        full_name: responsibleFullName.trim(),
        phone: responsiblePhone.trim(),
        role: "center_admin",
        is_active: true,
      })
      .eq("id", userId);

    if (updateProfileError) {
      await adminClient.auth.admin.deleteUser(userId);
      return jsonResponse({ error: updateProfileError.message }, 400);
    }

    const { data: createdCenter, error: createCenterError } = await adminClient
      .from("centers")
      .insert({
        name: centerName.trim(),
        address: centerAddress.trim(),
        city: centerCity.trim(),
        phone: centerPhone.trim(),
        email: centerEmail.trim().toLowerCase(),
        latitude,
        longitude,
        admin_id: userId,
        is_active: true,
      })
      .select("id")
      .single();

    if (createCenterError || !createdCenter) {
      await adminClient.auth.admin.deleteUser(userId);
      return jsonResponse({ error: createCenterError?.message ?? "Unable to create center." }, 400);
    }

    return jsonResponse({
      success: true,
      userId,
      centerId: createdCenter.id,
    });
  } catch (error) {
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : "Unexpected error.",
      },
      500,
    );
  }
});
