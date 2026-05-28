import { View, Text } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface Donation {
  id: string;
  donation_date: string;
  volume_ml: number;
  status: "validated" | "pending" | "rejected";
  centers?: {
    name: string;
    city: string;
  };
}

interface Props {
  data: string | Donation[];
}

export default function DonationsHistoryList({ data }: Props) {
  let donations: Donation[] = [];

  try {
    donations = typeof data === "string" ? JSON.parse(data) : data;
  } catch {
    donations = [];
  }

  if (!Array.isArray(donations) || donations.length === 0) {
    return (
      <View className="my-2 bg-gray-50 border border-gray-200 rounded-2xl p-4 flex-row items-center shadow-xs">
        <MaterialIcons name="opacity" size={20} color="#666" />
        <Text className="text-xs text-gray-500 font-semibold ml-2.5">Aucun don enregistré dans l'historique.</Text>
      </View>
    );
  }

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <View className="my-2 bg-white border border-gray-100 rounded-2xl p-4 shadow-xs">
      <Text className="text-gray-900 font-extrabold text-[14px] mb-4">Historique de vos dons</Text>

      <View className="gap-4">
        {donations.map((item, index) => {
          const isLast = index === donations.length - 1;
          const centerName = item.centers?.name ?? "Centre BloodLink";

          return (
            <View key={item.id} className="flex-row items-stretch">
              {/* Timeline marker */}
              <View className="items-center mr-3 flex-shrink-0">
                <View className="w-6 h-6 rounded-full bg-[#b80035]/10 items-center justify-center border border-[#b80035]/20">
                  <MaterialIcons name="opacity" size={12} color="#b80035" />
                </View>
                {!isLast && <View className="w-0.5 bg-[#b80035]/20 flex-1 my-1" />}
              </View>

              {/* Donation Info */}
              <View className="flex-1 pb-4">
                <Text className="text-gray-900 font-bold text-xs">{formatDate(item.donation_date)}</Text>
                <Text className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wider font-semibold">{centerName}</Text>
                <View className="flex-row justify-between items-center mt-2 bg-gray-50 border border-black/5 rounded-xl p-2.5">
                  <View className="flex-row items-center">
                    <MaterialIcons name="local-drink" size={13} color="#666" />
                    <Text className="text-[11px] text-gray-600 font-semibold ml-1">{item.volume_ml} ml prélevés</Text>
                  </View>
                  <View className="bg-emerald-50 px-2 py-0.5 rounded-full flex-row items-center border border-emerald-100">
                    <MaterialIcons name="check" size={9} color="#059669" />
                    <Text className="text-emerald-700 text-[9px] font-bold ml-0.5 uppercase">Validé</Text>
                  </View>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
