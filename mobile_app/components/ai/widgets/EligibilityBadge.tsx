import { View, Text } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface Props {
  eligible: boolean;
  reason?: string;
  missingFields?: string[];
  nextDonationDate?: string;
}

export default function EligibilityBadge({ eligible, reason, missingFields = [], nextDonationDate }: Props) {
  const hasMissingFields = missingFields && missingFields.length > 0;

  if (eligible) {
    return (
      <View className="my-2 bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex-row items-start shadow-sm">
        <View className="bg-emerald-500 rounded-xl p-2 mr-3">
          <MaterialIcons name="check" size={20} color="white" />
        </View>
        <View className="flex-1">
          <Text className="text-emerald-800 font-bold text-[15px]">Éligible pour un don</Text>
          <Text className="text-emerald-700 text-xs mt-1 leading-[18px]">
            {reason || "Toutes vos informations sont à jour et vous pouvez donner votre sang dès aujourd'hui."}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="my-2 bg-rose-50 border border-rose-100 rounded-2xl p-4 flex-row items-start shadow-sm">
      <View className="bg-rose-500 rounded-xl p-2 mr-3">
        <MaterialIcons name="error-outline" size={20} color="white" />
      </View>
      <View className="flex-1">
        <Text className="text-rose-800 font-bold text-[15px]">Non éligible pour le moment</Text>
        <Text className="text-rose-700 text-xs mt-1 leading-[18px]">
          {reason || "Vous ne remplissez pas encore toutes les conditions pour planifier un don."}
        </Text>

        {nextDonationDate && (
          <View className="mt-2.5 flex-row items-center">
            <MaterialIcons name="event" size={14} color="#be123c" />
            <Text className="text-rose-900 text-xs font-semibold ml-1.5">
              Prochain don possible : {nextDonationDate}
            </Text>
          </View>
        )}

        {hasMissingFields && (
          <View className="mt-2.5 bg-rose-100/50 rounded-xl p-2.5">
            <Text className="text-rose-900 text-xs font-bold mb-1">Champs à compléter dans votre profil :</Text>
            <View className="flex-row flex-wrap gap-1.5 mt-1">
              {missingFields.map((field) => (
                <View key={field} className="bg-white/80 border border-rose-200 px-2 py-0.5 rounded-full">
                  <Text className="text-rose-700 text-[10px] font-bold capitalize">{field}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
