import { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { getUnreadCount } from "@/services/notifications";

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    getUnreadCount(user.id).then(setUnreadCount).catch(() => {});
  }, [user?.id]);

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <View className="flex-row items-center gap-2">
          <MaterialIcons name="bloodtype" size={24} color="#b80035" />
          <Text className="text-xl font-bold text-primary">
            Blood<Text className="text-on-surface">Link</Text>
          </Text>
        </View>
        <Pressable
          className="p-2 rounded-full bg-surface-container-low relative"
          onPress={() => router.push("/notifications" as any)}
        >
          <MaterialIcons name="notifications" size={22} color="#5c3f40" />
          {unreadCount > 0 && (
            <View className="absolute -top-0.5 -right-0.5 bg-primary rounded-full items-center justify-center min-w-[18px] min-h-[18px] px-1">
              <Text className="text-white text-[9px] font-bold">
                {unreadCount > 99 ? "99+" : unreadCount}
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Urgent Alert Card */}
        <View className="bg-surface-container-lowest rounded-2xl p-5 mb-4 shadow-sm border border-black/5">
          <View className="flex-row items-center gap-1.5 mb-3">
            <View className="flex-row items-center gap-1 bg-primary-container/20 px-3 py-1 rounded-full">
              <MaterialIcons name="emergency" size={12} color="#b80035" />
              <Text className="text-primary text-[10px] font-bold uppercase tracking-wider">
                URGENCE
              </Text>
            </View>
          </View>

          <View className="flex-row justify-between items-start gap-3">
            <View className="flex-1">
              <Text className="text-xl font-extrabold text-on-surface leading-tight">
                URGENT: B+ Recherché
              </Text>
              <Text className="text-sm text-on-surface-variant mt-1">
                Hôpital Général: pénurie aiguë suite à un accident.
              </Text>
            </View>
            <View className="w-16 h-16 rounded-xl bg-surface-container-high overflow-hidden items-center justify-center">
              <MaterialIcons name="local-hospital" size={28} color="#006591" />
            </View>
          </View>

          <View className="flex-row gap-3 mt-4">
            <View className="flex-1 bg-surface-container-highest p-3 rounded-xl">
              <Text className="text-[10px] text-on-surface-variant uppercase font-bold">
                Unités requises
              </Text>
              <Text className="text-lg font-extrabold text-primary">12</Text>
            </View>
            <Pressable 
              className="flex-1 bg-secondary/10 p-3 rounded-xl flex-row items-center justify-center gap-1 active:bg-secondary/20"
              onPress={() => router.push("/share-alert")}
            >
              <MaterialIcons name="share" size={16} color="#006591" />
              <Text className="text-[10px] font-bold text-secondary uppercase">
                Partager
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Quick Actions */}
        <Text className="text-sm font-bold text-on-surface mb-3 px-1">
          Actions rapides
        </Text>
        <View className="flex-row gap-3 mb-4">
          <Pressable
            className="flex-1 bg-surface-container-lowest p-4 rounded-2xl items-center border border-black/5 active:bg-surface-container-low"
            onPress={() => router.push("/map")}
          >
            <View className="w-10 h-10 bg-primary/10 rounded-xl items-center justify-center mb-2">
              <MaterialIcons name="location-on" size={20} color="#b80035" />
            </View>
            <Text className="text-xs font-semibold text-on-surface">Centres</Text>
          </Pressable>
          <Pressable
            className="flex-1 bg-surface-container-lowest p-4 rounded-2xl items-center border border-black/5 active:bg-surface-container-low"
            onPress={() => router.push("/appointments" as any)}
          >
            <View className="w-10 h-10 bg-secondary/10 rounded-xl items-center justify-center mb-2">
              <MaterialIcons name="event" size={20} color="#006591" />
            </View>
            <Text className="text-xs font-semibold text-on-surface">RDV</Text>
          </Pressable>
          <Pressable
            className="flex-1 bg-surface-container-lowest p-4 rounded-2xl items-center border border-black/5 active:bg-surface-container-low"
            onPress={() => router.push("/notifications" as any)}
          >
            <View className="w-10 h-10 bg-tertiary/10 rounded-xl items-center justify-center mb-2">
              <MaterialIcons name="notifications" size={20} color="#006847" />
            </View>
            <Text className="text-xs font-semibold text-on-surface">Alertes</Text>
          </Pressable>
        </View>

        {/* Stats */}
        <Text className="text-sm font-bold text-on-surface mb-3 px-1">
          Votre impact
        </Text>
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-surface-container-lowest p-4 rounded-2xl border border-black/5">
            <View className="flex-row items-center gap-2 mb-2">
              <View className="w-8 h-8 bg-primary/10 rounded-full items-center justify-center">
                <MaterialIcons name="opacity" size={16} color="#b80035" />
              </View>
              <Text className="text-[10px] text-on-surface-variant uppercase font-bold">
                Dons effectués
              </Text>
            </View>
            <Text className="text-2xl font-extrabold text-on-surface">3</Text>
          </View>
          <View className="flex-1 bg-surface-container-lowest p-4 rounded-2xl border border-black/5">
            <View className="flex-row items-center gap-2 mb-2">
              <View className="w-8 h-8 bg-tertiary/10 rounded-full items-center justify-center">
                <MaterialIcons name="favorite" size={16} color="#006847" />
              </View>
              <Text className="text-[10px] text-on-surface-variant uppercase font-bold">
                Vies sauvées
              </Text>
            </View>
            <Text className="text-2xl font-extrabold text-on-surface">9</Text>
          </View>
        </View>

        {/* Next Donation */}
        <View className="bg-primary p-5 rounded-2xl shadow-lg shadow-primary/20">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-white/80 text-xs uppercase font-bold tracking-wider mb-1">
                Prochain don possible
              </Text>
              <Text className="text-white text-xl font-extrabold">
                Dans 12 jours
              </Text>
              <Text className="text-white/70 text-xs mt-1">
                Dernier don: 14 oct. 2025
              </Text>
            </View>
            <Pressable
              className="w-12 h-12 bg-white/20 rounded-full items-center justify-center"
              onPress={() => router.push("/booking" as any)}
            >
              <MaterialIcons name="calendar-today" size={24} color="#ffffff" />
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
