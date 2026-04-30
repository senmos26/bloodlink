import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";

export default function MapScreen() {
  return (
    <SafeAreaView className="flex-1 bg-surface items-center justify-center px-8">
      <View className="w-20 h-20 bg-surface-container-low rounded-3xl items-center justify-center mb-4">
        <MaterialIcons name="map" size={36} color="#5c3f40" />
      </View>
      <Text className="text-lg font-bold text-on-surface text-center mb-1">
        Carte des centres
      </Text>
      <Text className="text-sm text-on-surface-variant text-center max-w-[260px]">
        La carte interactive est disponible uniquement sur l'application mobile.
      </Text>
    </SafeAreaView>
  );
}
