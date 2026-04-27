import { supabase } from "@/services/supabase";

export type BloodType = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";

const PROFILE_AVATARS_BUCKET = "profile-avatars";

export interface ProfileRecord {
  id: string;
  full_name: string;
  phone: string | null;
  avatar_path: string | null;
  blood_type: BloodType | null;
  date_of_birth: string | null;
  weight_kg: number | null;
  role: "donor" | "center_admin" | "super_admin";
  is_active: boolean;
  next_donation_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface DonationSummary {
  id: string;
  center_name: string;
  donation_date: string;
  status: string;
  volume_ml: number;
}

export interface ProfileDashboard {
  profile: ProfileRecord;
  recent_donations: DonationSummary[];
}

export interface UpdateMyProfilePayload {
  fullName?: string;
  phone?: string;
  bloodType?: BloodType;
  dateOfBirth?: string;
  weightKg?: number;
}

export interface UploadProfileAvatarPayload {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
}

function toAppError(error: unknown, fallbackMessage: string) {
  if (error instanceof Error) {
    return error;
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = typeof error.message === "string" ? error.message : fallbackMessage;
    return new Error(message);
  }

  return new Error(fallbackMessage);
}

function getFileExtension(fileName?: string | null, mimeType?: string | null) {
  const explicitExtension = fileName?.split(".").pop()?.toLowerCase();

  if (explicitExtension) {
    return explicitExtension;
  }

  if (mimeType === "image/png") {
    return "png";
  }

  if (mimeType === "image/webp") {
    return "webp";
  }

  return "jpg";
}

async function getCurrentUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw toAppError(error, "Impossible de récupérer l'utilisateur courant.");
  }

  if (!user) {
    throw new Error("Not authenticated");
  }

  return user.id;
}

export async function getMyProfileDashboard(): Promise<ProfileDashboard> {
  const { data, error } = await supabase.rpc("get_my_profile_dashboard");

  if (error) {
    throw toAppError(error, "Impossible de récupérer le dashboard profil.");
  }

  return data as ProfileDashboard;
}

export async function updateMyProfile(payload: UpdateMyProfilePayload): Promise<ProfileRecord> {
  const { data, error } = await supabase.rpc("update_my_profile", {
    p_full_name: payload.fullName ?? null,
    p_phone: payload.phone ?? null,
    p_blood_type: payload.bloodType ?? null,
    p_date_of_birth: payload.dateOfBirth ?? null,
    p_weight_kg: payload.weightKg ?? null,
  });

  if (error) {
    throw toAppError(error, "Impossible de mettre à jour le profil.");
  }

  return data as ProfileRecord;
}

export async function updateMyProfileAvatar(avatarPath: string | null): Promise<ProfileRecord> {
  const { data, error } = await supabase.rpc("update_my_profile_avatar", {
    p_avatar_path: avatarPath,
  });

  if (error) {
    throw toAppError(error, "Impossible de mettre à jour la photo de profil.");
  }

  return data as ProfileRecord;
}

export async function getProfileAvatarUrl(avatarPath: string | null) {
  if (!avatarPath) {
    return null;
  }

  const { data, error } = await supabase.storage
    .from(PROFILE_AVATARS_BUCKET)
    .createSignedUrl(avatarPath, 60 * 60);

  if (error) {
    throw toAppError(error, "Impossible de récupérer la photo de profil.");
  }

  return data.signedUrl;
}

export async function uploadMyProfileAvatar(payload: UploadProfileAvatarPayload): Promise<ProfileRecord> {
  const userId = await getCurrentUserId();
  const fileExtension = getFileExtension(payload.fileName, payload.mimeType);
  const avatarPath = `${userId}/avatar-${Date.now()}.${fileExtension}`;
  const arrayBuffer = await fetch(payload.uri).then((response) => response.arrayBuffer());

  const { error } = await supabase.storage.from(PROFILE_AVATARS_BUCKET).upload(avatarPath, arrayBuffer, {
    contentType: payload.mimeType ?? "image/jpeg",
    upsert: false,
  });

  if (error) {
    throw toAppError(error, "Impossible d'envoyer la photo de profil.");
  }

  return updateMyProfileAvatar(avatarPath);
}

export async function removeMyProfileAvatar(avatarPath: string | null): Promise<ProfileRecord> {
  if (avatarPath) {
    const { error } = await supabase.storage.from(PROFILE_AVATARS_BUCKET).remove([avatarPath]);

    if (error) {
      throw toAppError(error, "Impossible de supprimer la photo de profil.");
    }
  }

  return updateMyProfileAvatar(null);
}
