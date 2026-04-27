import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { supabase } from "@/services/supabase";

export default function ProfileScreen() {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/(auth)/login");
  };
  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Profile Hero */}
        <View className="items-center pt-8 pb-6 px-6">
          <View className="relative mb-3">
            <View className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary-container p-0.5 bg-surface-container-lowest">
              <View className="w-full h-full bg-surface-container-high rounded-full items-center justify-center">
                <MaterialIcons name="person" size={40} color="#906f70" />
              </View>
            </View>
            <View className="absolute bottom-0 right-0 bg-tertiary p-1.5 rounded-full shadow-lg">
              <MaterialIcons name="verified" size={12} color="#ffffff" />
            </View>
          </View>
          <Text className="text-xl font-extrabold text-on-surface">
            Jean Dupont
          </Text>
          <View className="flex-row gap-2 mt-2">
            <View className="px-2.5 py-0.5 bg-rose-50 rounded-full border border-rose-100">
              <Text className="text-rose-700 text-[10px] font-bold uppercase tracking-wider">
                Donneur actif
              </Text>
            </View>
            <View className="px-2.5 py-0.5 bg-surface-container-high rounded-full">
              <Text className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">
                O+
              </Text>
            </View>
          </View>
        </View>

        {/* Vitality Stats */}
        <View className="flex-row gap-3 px-4 mb-4">
          <View className="flex-1 bg-surface-container-lowest p-4 rounded-2xl items-center border border-black/5">
            <Text className="text-on-surface-variant text-[10px] font-semibold uppercase tracking-widest mb-1">
              Groupe
            </Text>
            <Text className="text-2xl font-extrabold text-primary">O+</Text>
          </View>
          <View className="flex-1 bg-surface-container-lowest p-4 rounded-2xl items-center border border-black/5">
            <Text className="text-on-surface-variant text-[10px] font-semibold uppercase tracking-widest mb-1">
              Poids
            </Text>
            <Text className="text-2xl font-extrabold text-on-surface">
              78<Text className="text-sm text-on-surface-variant">kg</Text>
            </Text>
          </View>
          <View className="flex-1 bg-surface-container-lowest p-4 rounded-2xl items-center border border-black/5">
            <Text className="text-on-surface-variant text-[10px] font-semibold uppercase tracking-widest mb-1">
              Prochain
            </Text>
            <Text className="text-base font-bold text-tertiary">12 j</Text>
          </View>
        </View>

        {/* Donation History */}
        <View className="px-4 mb-4">
          <View className="flex-row items-center justify-between mb-3 px-1">
            <Text className="text-sm font-bold text-on-surface">
              Dons récents
            </Text>
            <Pressable>
              <Text className="text-primary text-xs font-bold uppercase">
                Voir tout
              </Text>
            </Pressable>
          </View>

          <View className="bg-surface-container-lowest rounded-2xl overflow-hidden border border-black/5">
            {[
              { center: "Clinique Générale", date: "14 oct. 2025", status: "validé" },
              { center: "Unité Mobile", date: "12 juil. 2025", status: "validé" },
            ].map((don, i) => (
              <View
                key={i}
                className={`flex-row items-center justify-between p-4 ${
                  i === 0 ? "border-b border-surface-container-high/20" : ""
                }`}
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-8 h-8 rounded-full bg-rose-50 items-center justify-center">
                    <MaterialIcons name="opacity" size={16} color="#b80035" />
                  </View>
                  <View>
                    <Text className="text-sm font-bold text-on-surface">
                      {don.center}
                    </Text>
                    <Text className="text-[10px] text-on-surface-variant">
                      {don.date}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center gap-1 px-2 py-0.5 bg-tertiary-container/10 rounded-full">
                  <MaterialIcons name="check-circle" size={12} color="#006847" />
                  <Text className="text-[9px] font-bold uppercase text-tertiary">
                    {don.status}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Settings */}
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
            <Pressable className="flex-row items-center justify-between p-4 border-b border-surface-container-high/20 active:bg-surface-container-low">
              <View className="flex-row items-center gap-3">
                <MaterialIcons name="edit" size={20} color="#5c3f40" />
                <Text className="text-sm font-semibold text-on-surface">
                  Modifier profil
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
