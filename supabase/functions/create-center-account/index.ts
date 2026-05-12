import { createClient } from "jsr:@supabase/supabase-js@2";

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

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (payload.responsibleEmail && !emailRegex.test(payload.responsibleEmail.trim())) {
    throw new Error("Format d'email invalide pour le responsable.");
  }
  if (payload.centerEmail && !emailRegex.test(payload.centerEmail.trim())) {
    throw new Error("Format d'email invalide pour le centre.");
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
    // 1. Verify caller is authenticated
    const { data: authData, error: authError } = await userClient.auth.getUser();

    if (authError || !authData.user) {
      return jsonResponse({ error: "Unauthorized." }, 401);
    }

    // 2. Verify caller is super_admin
    const { data: callerProfile, error: profileError } = await userClient
      .from("profiles")
      .select("role, is_active")
      .eq("id", authData.user.id)
      .single();

    if (profileError || !callerProfile) {
      return jsonResponse({ error: "Caller profile not found." }, 403);
    }

    if (!callerProfile.is_active) {
      return jsonResponse({ error: "Votre compte est désactivé." }, 403);
    }

    if (callerProfile.role !== "super_admin") {
      return jsonResponse({ error: "Seul un super administrateur peut créer un compte centre." }, 403);
    }

    // 3. Validate payload
    const payload = (await request.json()) as Partial<CreateCenterAccountPayload>;
    validatePayload(payload);

    const {
      responsibleFullName,
      responsibleEmail,
      responsiblePhone,
      centerName,
      centerAddress,
      centerCity,
      centerPhone,
      centerEmail,
      latitude,
      longitude,
    } = payload as CreateCenterAccountPayload;

    const normalizedEmail = responsibleEmail.trim().toLowerCase();

    // 4. Check email uniqueness before creating user
    const { data: { users: existingUsers } } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });
    const emailExists = existingUsers.some(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );

    // Also check if a center already has this email
    const { data: existingCenter } = await adminClient
      .from("centers")
      .select("id")
      .eq("email", normalizedEmail)
      .limit(1);

    if (emailExists || (existingCenter && existingCenter.length > 0)) {
      return jsonResponse({ error: "Un compte avec cet email existe déjà." }, 409);
    }

    // 5. Invite user by email — sends an invitation link to set their password
    // The trigger handle_new_user will create the profile with role='donor'
    // We update it to 'center_admin' right after
    const redirectUrl = Deno.env.get("CENTER_WEB_URL") ?? "http://localhost:3000";
    const { data: invitedUser, error: inviteError } =
      await adminClient.auth.admin.inviteUserByEmail(normalizedEmail, {
        data: {
          full_name: responsibleFullName.trim(),
          phone: responsiblePhone.trim(),
        },
        redirectTo: `${redirectUrl}/login`,
      });

    if (inviteError || !invitedUser.user) {
      return jsonResponse({ error: inviteError?.message ?? "Unable to invite user." }, 400);
    }

    const userId = invitedUser.user.id;

    // 6. Update profile: set role to center_admin (override the trigger default of 'donor')
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
      // Rollback: delete user and profile
      await adminClient.auth.admin.deleteUser(userId);
      return jsonResponse({ error: updateProfileError.message }, 400);
    }

    // 7. Create the center linked to the new admin
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
      // Rollback: delete user (profile will be cascade-deleted by FK or trigger)
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
