import { Pressable, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Button from "@/components/ui/Button";
import KitInput from "@/components/ui/KitInput";
import ProfileDateInput from "@/components/ui/ProfileDateInput";
import type { BloodType } from "@/services/profile";

const BLOOD_GROUPS: BloodType[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

type ProfileFormState = {
  fullName: string;
  phone: string;
  bloodType: BloodType | null;
  dateOfBirth: string;
  weightKg: string;
};

type ProfileFormErrors = Partial<Record<keyof ProfileFormState, string>>;

type ProfileEditCardProps = {
  form: ProfileFormState;
  errors: ProfileFormErrors;
  saving: boolean;
  onChange: (patch: Partial<ProfileFormState>) => void;
  onSave: () => void;
  onCancel: () => void;
};

export default function ProfileEditCard({
  form,
  errors,
  saving,
  onChange,
  onSave,
  onCancel,
}: ProfileEditCardProps) {
  return (
    <View className="px-4 mb-4">
      <View className="bg-surface-container-lowest rounded-3xl p-5 border border-black/5 gap-3">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-base font-extrabold text-on-surface">Modifier mon profil</Text>
            <Text className="text-xs text-on-surface-variant mt-1">
              Mets à jour tes informations personnelles avec une meilleure expérience de saisie.
            </Text>
          </View>
          <View className="h-10 w-10 rounded-2xl bg-primary/10 items-center justify-center">
            <MaterialIcons name="edit-square" size={20} color="#b80035" />
          </View>
        </View>

        <KitInput
          label="Nom complet"
          value={form.fullName}
          onChangeText={(value) => onChange({ fullName: value })}
          iconName="badge"
          error={errors.fullName}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
        />

        <KitInput
          label="Téléphone"
          value={form.phone}
          onChangeText={(value) => onChange({ phone: value })}
          iconName="phone"
          error={errors.phone}
          helperText={!errors.phone ? "Format international recommandé, ex: +228 90 00 00 00" : undefined}
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
        />

        <ProfileDateInput
          label="Date de naissance"
          value={form.dateOfBirth}
          onChange={(value) => onChange({ dateOfBirth: value })}
          error={errors.dateOfBirth}
          helperText={!errors.dateOfBirth ? "Sélectionne ta date via le calendrier." : undefined}
          maximumDate={new Date()}
          minimumDate={new Date(1940, 0, 1)}
        />

        <KitInput
          label="Poids (kg)"
          value={form.weightKg}
          onChangeText={(value) => onChange({ weightKg: value })}
          iconName="monitor-weight"
          error={errors.weightKg}
          helperText={!errors.weightKg ? "Minimum recommandé: 50 kg" : undefined}
          keyboardType="decimal-pad"
          placeholder="70"
        />

        <View className="mt-1">
          <Text className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
            Groupe sanguin
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {BLOOD_GROUPS.map((group) => {
              const selected = form.bloodType === group;
              return (
                <Pressable
                  key={group}
                  onPress={() => onChange({ bloodType: group })}
                  className={`px-3.5 py-2.5 rounded-2xl border ${
                    selected ? "bg-primary border-primary" : "bg-white border-surface-container-high"
                  }`}
                >
                  <Text className={`font-extrabold ${selected ? "text-white" : "text-on-surface"}`}>{group}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="flex-row gap-3 pt-2">
          <Button onPress={onSave} loading={saving} className="flex-1">
            Enregistrer
          </Button>
          <Button onPress={onCancel} variant="outline" className="flex-1">
            Annuler
          </Button>
        </View>
      </View>
    </View>
  );
}
