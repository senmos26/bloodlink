import { View, Text, FlatList, Pressable, Linking } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface Center {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  distance_km?: number;
}

interface Props {
  data: string | Center[];
  onSendMessage?: (text: string) => void;
}

export default function CentersCarousel({ data, onSendMessage }: Props) {
  let centers: Center[] = [];

  try {
    centers = typeof data === "string" ? JSON.parse(data) : data;
  } catch {
    centers = [];
  }

  if (!Array.isArray(centers) || centers.length === 0) {
    return (
      <View className="my-2 p-4 bg-gray-50 rounded-2xl border border-gray-200">
        <Text className="text-xs text-gray-500 text-center">Aucun centre disponible ou erreur de données.</Text>
      </View>
    );
  }

  const handleCall = (phone: string) => {
    if (phone) {
      void Linking.openURL(`tel:${phone}`);
    }
  };

  const handleBook = (centerName: string, centerId: string) => {
    if (onSendMessage) {
      onSendMessage(`Je souhaite prendre rendez-vous au centre de transfusion : ${centerName} (ID: ${centerId})`);
    }
  };

  return (
    <View className="my-2">
      <FlatList
        data={centers}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingRight: 16 }}
        renderItem={({ item }) => (
          <View className="bg-white border border-gray-100 rounded-2xl p-4 mr-3 shadow-xs w-[250px] justify-between">
            <View>
              {/* Header card */}
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1 mr-2">
                  <Text className="text-gray-900 font-extrabold text-sm leading-[18px]" numberOfLines={2}>
                    {item.name}
                  </Text>
                </View>
                {item.distance_km !== undefined && (
                  <View className="bg-[#b80035]/10 px-2 py-0.5 rounded-full flex-row items-center">
                    <MaterialIcons name="navigation" size={10} color="#b80035" />
                    <Text className="text-[#b80035] text-[10px] font-bold ml-0.5">{item.distance_km} km</Text>
                  </View>
                )}
              </View>

              {/* Localisation details */}
              <View className="flex-row items-start mb-1.5">
                <MaterialIcons name="place" size={14} color="#666" className="mt-0.5" />
                <Text className="text-[11px] text-gray-500 ml-1 flex-1 leading-[15px]" numberOfLines={2}>
                  {item.address}, {item.city}
                </Text>
              </View>

              {item.phone && (
                <View className="flex-row items-center mb-4">
                  <MaterialIcons name="phone" size={13} color="#666" />
                  <Text className="text-[11px] text-gray-500 ml-1.5">{item.phone}</Text>
                </View>
              )}
            </View>

            {/* Actions block */}
            <View className="flex-row gap-2">
              {item.phone && (
                <Pressable
                  onPress={() => handleCall(item.phone)}
                  className="bg-gray-100 hover:bg-gray-200 active:bg-gray-200 p-2.5 rounded-xl justify-center items-center"
                >
                  <MaterialIcons name="call" size={16} color="#444" />
                </Pressable>
              )}
              <Pressable
                onPress={() => handleBook(item.name, item.id)}
                className="flex-1 bg-[#b80035] active:bg-[#900028] py-2 px-3 rounded-xl flex-row items-center justify-center gap-1.5"
              >
                <MaterialIcons name="event" size={14} color="white" />
                <Text className="text-white text-xs font-bold">Réserver</Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    </View>
  );
}
