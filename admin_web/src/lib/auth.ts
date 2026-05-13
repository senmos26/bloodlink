import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";
import type { Center, Profile, UserRole } from "@/types/database";

export interface AdminContext {
  session: Session;
  user: Session["user"];
  profile: Profile;
  role: UserRole;
  center: Center | null;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function verifyCurrentPassword(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error("L'ancien mot de passe est incorrect.");
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateAdminProfile(
  userId: string,
  updates: Pick<Profile, "full_name" | "phone">
) {
  const { data, error } = await supabase
    .from("profiles")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("*")
    .single<Profile>();

  if (error) {
    throw new Error("Impossible de mettre à jour le profil.");
  }

  return data;
}

export async function updateAdminEmail(email: string) {
  const { data, error } = await supabase.auth.updateUser({ email });

  if (error) {
    throw new Error(error.message);
  }

  return data.user;
}

export async function sendPasswordResetEmail(
  email: string,
  redirectTo: string
) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function updatePassword(password: string) {
  const { data, error } = await supabase.auth.updateUser({ password });

  if (error) {
    throw new Error(error.message);
  }

  return data.user;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(error.message);
  }

  return data.session;
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single<Profile>();

  if (error) {
    throw new Error("Profil utilisateur introuvable.");
  }

  return data;
}

export async function getCenterForAdmin(userId: string) {
  const { data, error } = await supabase
    .from("centers")
    .select("*")
    .eq("admin_id", userId)
    .maybeSingle<Center>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getCurrentAdminContext(): Promise<AdminContext> {
  const session = await getSession();

  if (!session) {
    throw new Error("Session introuvable.");
  }

  const profile = await getProfile(session.user.id);

  if (!profile) {
    throw new Error("Profil utilisateur introuvable.");
  }

  if (!profile.is_active) {
    await signOut();
    throw new Error("Compte désactivé.");
  }

  if (profile.role === "donor") {
    await signOut();
    throw new Error("Accès réservé aux centres et administrateurs.");
  }

  if (profile.role === "center_admin") {
    const center = await getCenterForAdmin(profile.id);

    if (!center) {
      throw new Error("Aucun centre n'est associé à ce compte.");
    }

    if (!center.is_active) {
      throw new Error("Votre centre est désactivé.");
    }

    return {
      session,
      user: session.user,
      profile,
      role: profile.role,
      center,
    };
  }

  return {
    session,
    user: session.user,
    profile,
    role: profile.role,
    center: null,
  };
}

export async function isDonor() {
  const session = await getSession();

  if (!session) {
    return false;
  }

  const profile = await getProfile(session.user.id);
  return profile.role === "donor";
}

export async function isCenterAdmin() {
  const session = await getSession();

  if (!session) {
    return false;
  }

  const profile = await getProfile(session.user.id);
  return profile.role === "center_admin";
}

export async function isSuperAdmin() {
  const session = await getSession();

  if (!session) {
    return false;
  }

  const profile = await getProfile(session.user.id);
  return profile.role === "super_admin";
}

export async function isAllowedAdminRole() {
  const session = await getSession();

  if (!session) {
    return false;
  }

  const profile = await getProfile(session.user.id);
  return profile.role === "center_admin" || profile.role === "super_admin";
}
