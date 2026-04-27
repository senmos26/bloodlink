import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import Button from "@/components/ui/Button";
import ProfileEditCard from "@/components/profile/ProfileEditCard";
import ProfileAvatarModal from "@/components/ui/ProfileAvatarModal";
import ProfileAvatarPicker from "@/components/ui/ProfileAvatarPicker";
import Toast, { type ToastType } from "@/components/ui/Toast";
import {
  getMyProfileDashboard,
  getProfileAvatarUrl,
  removeMyProfileAvatar,
  type BloodType,
  type DonationSummary,
  type ProfileDashboard,
  updateMyProfile,
  uploadMyProfileAvatar,
} from "@/services/profile";
import { supabase } from "@/services/supabase";

type ProfileFormState = {
  fullName: string;
  phone: string;
  bloodType: BloodType | null;
  dateOfBirth: string;
  weightKg: string;
};

type ProfileFormErrors = Partial<Record<keyof ProfileFormState, string>>;

const EMPTY_FORM: ProfileFormState = {
  fullName: "",
  phone: "",
  bloodType: null,
  dateOfBirth: "",
  weightKg: "",
};

const EMPTY_ERRORS: ProfileFormErrors = {};

function formatDateLabel(date: string | null) {
  if (!date) {
    return "—";
  }

  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDaysUntil(date: string | null) {
  if (!date) {
    return "—";
  }

  const today = new Date();
  const target = new Date(date);
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return "Aujourd'hui";
  }

  return `${diffDays} j`;
}

function getRoleLabel(role: ProfileDashboard["profile"]["role"]) {
  if (role === "center_admin") {
    return "Admin centre";
  }

  if (role === "super_admin") {
    return "Super admin";
  }

  return "Donneur actif";
}

function getDonationStatusLabel(status: string) {
  if (status === "validated") {
    return "validé";
  }

  if (status === "pending") {
    return "en attente";
  }

  if (status === "rejected") {
    return "rejeté";
  }

  return status;
}

function buildFormState(dashboard: ProfileDashboard): ProfileFormState {
  return {
    fullName: dashboard.profile.full_name ?? "",
    phone: dashboard.profile.phone ?? "",
    bloodType: dashboard.profile.blood_type,
    dateOfBirth: dashboard.profile.date_of_birth ?? "",
    weightKg: dashboard.profile.weight_kg ? String(dashboard.profile.weight_kg) : "",
  };
}

function getInitials(fullName: string) {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function sanitizePhoneInput(value: string) {
  return value.replace(/[^0-9+()\-\s]/g, "");
}

function validateProfileForm(form: ProfileFormState): ProfileFormErrors {
  const nextErrors: ProfileFormErrors = {};
  const trimmedName = (form.fullName ?? "").trim();
  const trimmedPhone = (form.phone ?? "").trim();
  const normalizedWeight = (form.weightKg ?? "").trim();
  const parsedWeight = normalizedWeight ? Number(normalizedWeight.replace(",", ".")) : undefined;

  if (!trimmedName) {
    nextErrors.fullName = "Le nom complet est obligatoire.";
  }

  if (trimmedPhone && trimmedPhone.replace(/[^\d]/g, "").length < 8) {
    nextErrors.phone = "Le numéro semble trop court.";
  }

  if (form.dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(form.dateOfBirth)) {
    nextErrors.dateOfBirth = "Sélectionne une date valide.";
  }

  if (parsedWeight !== undefined && Number.isNaN(parsedWeight)) {
    nextErrors.weightKg = "Le poids doit être un nombre valide.";
  }

  return nextErrors;
}

export default function ProfileScreen() {
  const [dashboard, setDashboard] = useState<ProfileDashboard | null>(null);
  const [form, setForm] = useState<ProfileFormState>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<ProfileFormErrors>(EMPTY_ERRORS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: ToastType }>({
    visible: false,
    message: "",
    type: "info",
  });

  const profile = dashboard?.profile ?? null;
  const recentDonations = dashboard?.recent_donations ?? [];

  const weightLabel = useMemo(() => {
    if (!profile?.weight_kg) {
      return "—";
    }

    return `${profile.weight_kg}kg`;
  }, [profile?.weight_kg]);

  const showToast = (message: string, type: ToastType) => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, visible: false }));
  };

  const applyProfileToDashboard = (nextProfile: ProfileDashboard["profile"]) => {
    setDashboard((prev) => {
      if (!prev) {
        return null;
      }

      return {
        ...prev,
        profile: nextProfile,
      };
    });
  };

  const handleFormChange = (patch: Partial<ProfileFormState>) => {
    const nextPatch: Partial<ProfileFormState> = { ...patch };

    if (patch.phone !== undefined) {
      nextPatch.phone = sanitizePhoneInput(patch.phone);
    }

    setForm((prev) => ({ ...prev, ...nextPatch }));
    setFormErrors((prev) => {
      const nextErrors = { ...prev };
      for (const key of Object.keys(patch) as Array<keyof ProfileFormState>) {
        delete nextErrors[key];
      }
      return nextErrors;
    });
  };

  const loadAvatar = async (avatarPath: string | null) => {
    try {
      const nextAvatarUrl = await getProfileAvatarUrl(avatarPath);
      setAvatarUrl(nextAvatarUrl);
    } catch {
      setAvatarUrl(null);
    }
  };

  const loadDashboard = async (isRefreshing = false) => {
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const nextDashboard = await getMyProfileDashboard();
      setDashboard(nextDashboard);
      setForm(buildFormState(nextDashboard));
      setFormErrors(EMPTY_ERRORS);
      await loadAvatar(nextDashboard.profile.avatar_path);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de charger le profil.";
      showToast(message, "error");
    } finally {
      if (isRefreshing) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.replace("/(auth)/login");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de se déconnecter.";
      showToast(message, "error");
    }
  };

  const handleSave = async () => {
    const nextErrors = validateProfileForm(form);

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      showToast("Corrige les champs signalés avant d'enregistrer.", "error");
      return;
    }

    const parsedWeight = form.weightKg.trim() ? Number(form.weightKg.replace(",", ".")) : undefined;

    setSaving(true);

    try {
      const updatedProfile = await updateMyProfile({
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        bloodType: form.bloodType ?? undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        weightKg: parsedWeight,
      });

      applyProfileToDashboard(updatedProfile);
      setEditMode(false);
      setFormErrors(EMPTY_ERRORS);
      showToast("Profil mis à jour avec succès.", "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de mettre à jour le profil.";
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (dashboard) {
      setForm(buildFormState(dashboard));
    }
    setFormErrors(EMPTY_ERRORS);
    setEditMode(false);
  };

  const handlePickAvatar = async () => {
    try {
      setUploadingAvatar(true);
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        showToast("L'accès à la galerie est nécessaire pour choisir une photo.", "warning");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const updatedProfile = await uploadMyProfileAvatar({
        uri: result.assets[0].uri,
        fileName: result.assets[0].fileName,
        mimeType: result.assets[0].mimeType,
      });

      applyProfileToDashboard(updatedProfile);
      await loadAvatar(updatedProfile.avatar_path);
      setAvatarModalVisible(false);
      showToast("Photo de profil mise à jour.", "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible d'envoyer la photo de profil.";
      showToast(message, "error");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setUploadingAvatar(true);
      const updatedProfile = await removeMyProfileAvatar(profile?.avatar_path ?? null);
      applyProfileToDashboard(updatedProfile);
      setAvatarUrl(null);
      setAvatarModalVisible(false);
      showToast("Photo de profil supprimée.", "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de supprimer la photo de profil.";
      showToast(message, "error");
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-surface">
        <View className="flex-1 items-center justify-center gap-4 px-8">
          <ActivityIndicator size="large" color="#b80035" />
          <Text className="text-sm text-on-surface-variant text-center">
            Chargement de votre profil...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!dashboard || !profile) {
    return (
      <SafeAreaView className="flex-1 bg-surface">
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onDismiss={hideToast}
        />
        <View className="flex-1 items-center justify-center gap-4 px-8">
          <MaterialIcons name="person-off" size={44} color="#906f70" />
          <Text className="text-lg font-bold text-on-surface text-center">
            Profil indisponible
          </Text>
          <Text className="text-sm text-on-surface-variant text-center">
            Impossible de récupérer vos données pour le moment.
          </Text>
          <Button onPress={() => void loadDashboard()} className="w-full max-w-[260px]">
            Réessayer
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onDismiss={hideToast}
      />
      <ProfileAvatarModal
        visible={avatarModalVisible}
        imageUrl={avatarUrl}
        uploading={uploadingAvatar}
        onClose={() => setAvatarModalVisible(false)}
        onChangePhoto={() => void handlePickAvatar()}
        onRemovePhoto={() => void handleRemoveAvatar()}
      />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadDashboard(true)} />}
      >
        <View className="items-center pt-8 pb-6 px-6">
          <ProfileAvatarPicker
            imageUrl={avatarUrl}
            initials={getInitials(profile.full_name)}
            uploading={uploadingAvatar}
            onPress={() => setAvatarModalVisible(true)}
          />
          <Text className="text-xl font-extrabold text-on-surface text-center">
            {profile.full_name}
          </Text>
          <Text className="text-sm text-on-surface-variant mt-1">
            {profile.phone || "Téléphone non renseigné"}
          </Text>
          <View className="flex-row gap-2 mt-2 flex-wrap justify-center">
            <View className="px-2.5 py-0.5 bg-rose-50 rounded-full border border-rose-100">
              <Text className="text-rose-700 text-[10px] font-bold uppercase tracking-wider">
                {getRoleLabel(profile.role)}
              </Text>
            </View>
            <View className="px-2.5 py-0.5 bg-surface-container-high rounded-full">
              <Text className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">
                {profile.blood_type || "Non défini"}
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row gap-3 px-4 mb-4">
          <View className="flex-1 bg-surface-container-lowest p-4 rounded-2xl items-center border border-black/5">
            <Text className="text-on-surface-variant text-[10px] font-semibold uppercase tracking-widest mb-1">
              Groupe
            </Text>
            <Text className="text-2xl font-extrabold text-primary">{profile.blood_type || "—"}</Text>
          </View>
          <View className="flex-1 bg-surface-container-lowest p-4 rounded-2xl items-center border border-black/5">
            <Text className="text-on-surface-variant text-[10px] font-semibold uppercase tracking-widest mb-1">
              Poids
            </Text>
            <Text className="text-2xl font-extrabold text-on-surface">{weightLabel}</Text>
          </View>
          <View className="flex-1 bg-surface-container-lowest p-4 rounded-2xl items-center border border-black/5">
            <Text className="text-on-surface-variant text-[10px] font-semibold uppercase tracking-widest mb-1">
              Prochain
            </Text>
            <Text className="text-base font-bold text-tertiary">{formatDaysUntil(profile.next_donation_date)}</Text>
          </View>
        </View>

        {editMode && (
          <ProfileEditCard
            form={form}
            errors={formErrors}
            saving={saving}
            onChange={(patch) => {
              const nextPatch: Partial<ProfileFormState> = { ...patch };

              if (patch.phone !== undefined) {
                nextPatch.phone = sanitizePhoneInput(patch.phone);
              }

              handleFormChange(nextPatch);
            }}
            onSave={handleSave}
            onCancel={handleCancelEdit}
          />
        )}

        <View className="px-4 mb-4">
          <View className="flex-row items-center justify-between mb-3 px-1">
            <Text className="text-sm font-bold text-on-surface">
              Dons récents
            </Text>
            <Text className="text-primary text-xs font-bold uppercase">
              {recentDonations.length}
            </Text>
          </View>

          <View className="bg-surface-container-lowest rounded-2xl overflow-hidden border border-black/5">
            {recentDonations.length === 0 ? (
              <View className="items-center justify-center px-6 py-8 gap-2">
                <MaterialIcons name="volunteer-activism" size={28} color="#906f70" />
                <Text className="text-sm font-semibold text-on-surface">
                  Aucun don récent
                </Text>
                <Text className="text-xs text-on-surface-variant text-center">
                  Votre historique de dons apparaîtra ici après vos premières validations.
                </Text>
              </View>
            ) : (
              recentDonations.map((donation: DonationSummary, index) => (
                <View
                  key={donation.id}
                  className={`flex-row items-center justify-between p-4 ${
                    index === 0 ? "border-b border-surface-container-high/20" : ""
                  }`}
                >
                  <View className="flex-row items-center gap-3 flex-1 pr-4">
                    <View className="w-8 h-8 rounded-full bg-rose-50 items-center justify-center">
                      <MaterialIcons name="opacity" size={16} color="#b80035" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-on-surface">
                        {donation.center_name}
                      </Text>
                      <Text className="text-[10px] text-on-surface-variant">
                        {formatDateLabel(donation.donation_date)}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-1 px-2 py-0.5 bg-tertiary-container/10 rounded-full">
                    <MaterialIcons name="check-circle" size={12} color="#006847" />
                    <Text className="text-[9px] font-bold uppercase text-tertiary">
                      {getDonationStatusLabel(donation.status)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        <View className="px-4 mb-4">
          <View className="bg-surface-container-lowest rounded-2xl overflow-hidden border border-black/5 p-4 gap-3">
            <Text className="text-sm font-bold text-on-surface">Informations santé</Text>
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-on-surface-variant">Date de naissance</Text>
              <Text className="text-sm font-semibold text-on-surface">{formatDateLabel(profile.date_of_birth)}</Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-on-surface-variant">Prochaine date de don</Text>
              <Text className="text-sm font-semibold text-on-surface">{formatDateLabel(profile.next_donation_date)}</Text>
            </View>
          </View>
        </View>

        <View className="px-4">
          <View className="bg-surface-container-lowest rounded-2xl overflow-hidden border border-black/5">
            <Pressable className="flex-row items-center justify-between p-4 border-b border-surface-container-high/20 active:bg-surface-container-low">
              <View className="flex-row items-center gap-3">
                <MaterialIcons name="notifications-active" size={20} color="#5c3f40" />
                <Text className="text-sm font-semibold text-on-surface">
                  Notifications
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#906f70" />
            </Pressable>
            <Pressable
              onPress={() => setEditMode((prev) => !prev)}
              className="flex-row items-center justify-between p-4 border-b border-surface-container-high/20 active:bg-surface-container-low"
            >
              <View className="flex-row items-center gap-3">
                <MaterialIcons name="edit" size={20} color="#5c3f40" />
                <Text className="text-sm font-semibold text-on-surface">
                  {editMode ? "Fermer l’édition" : "Modifier profil"}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#906f70" />
            </Pressable>
            <Pressable onPress={handleLogout} className="flex-row items-center justify-between p-4 active:bg-surface-container-low">
              <View className="flex-row items-center gap-3">
                <MaterialIcons name="logout" size={20} color="#ba1a1a" />
                <Text className="text-sm font-semibold text-error">
                  Déconnexion
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#906f70" />
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
