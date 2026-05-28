import { View, Text } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface Props {
  count: number;
  lives?: number;
  nextDate?: string | null;
  bloodType?: string | null;
}

export default function DonorStatsCard({ count, lives, nextDate, bloodType }: Props) {
  const livesCount = lives ?? count * 3;

  return (
    <View className="my-2 bg-[#b80035]/5 border border-[#b80035]/10 rounded-2xl p-4 shadow-xs">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-gray-900 font-extrabold text-[15px]">Tableau de bord donneur</Text>
        {bloodType && (
          <View className="bg-[#b80035] px-2.5 py-0.5 rounded-full">
            <Text className="text-white text-[11px] font-extrabold">{bloodType}</Text>
          </View>
        )}
      </View>

      <View className="flex-row gap-3">
        {/* Total Dons */}
        <View className="flex-1 bg-white border border-[#b80035]/10 rounded-xl p-3 items-center">
          <View className="w-8 h-8 rounded-full bg-[#b80035]/10 items-center justify-center mb-2">
            <MaterialIcons name="opacity" size={18} color="#b80035" />
          </View>
          <Text className="text-[20px] font-black text-gray-900">{count}</Text>
          <Text className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider text-center mt-0.5">Dons validés</Text>
        </View>

        {/* Vies sauvées */}
        <View className="flex-1 bg-white border border-emerald-100 rounded-xl p-3 items-center">
          <View className="w-8 h-8 rounded-full bg-emerald-50 items-center justify-center mb-2">
            <MaterialIcons name="favorite" size={18} color="#059669" />
          </View>
          <Text className="text-[20px] font-black text-emerald-600">{livesCount}</Text>
          <Text className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider text-center mt-0.5">Vies aidées</Text>
        </View>
      </View>

      {nextDate && (
        <View className="mt-3 bg-white/60 rounded-xl p-2.5 flex-row items-center border border-black/5">
          <MaterialIcons name="event" size={14} color="#555" />
          <Text className="text-xs text-gray-600 font-medium ml-2">
            Prochain don autorisé à partir du : <Text className="font-bold text-gray-800">{nextDate}</Text>
          </Text>
        </View>
      )}
    </View>
  );
}
