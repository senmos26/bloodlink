import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";

export default function MapScreen() {
  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-1 items-center justify-center px-6">
        <View className="w-20 h-20 bg-secondary/10 rounded-full items-center justify-center mb-4">
          <MaterialIcons name="map" size={40} color="#006591" />
        </View>
        <Text className="text-xl font-extrabold text-on-surface text-center mb-2">
          Carte des centres
        </Text>
        <Text className="text-sm text-on-surface-variant text-center max-w-[260px]">
          Trouvez les centres de collecte les plus proches de vous.
        </Text>
      </View>
    </SafeAreaView>
  );
}
