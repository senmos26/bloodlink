import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { getUnreadCount } from "@/services/notifications";
import {
  getUrgentAlerts,
  getDonorStats,
  getNextAppointment,
  type UrgentAlert,
  type DonorStats,
  type NextAppointment,
} from "@/services/dashboard";
import { getUrgencyColor, type UrgencyLevel } from "@/services/map";
import type { BloodType } from "@/services/profile";

// ── Helpers ────────────────────────────────────────────────────────────

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  const months = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function daysUntil(dateStr: string | null): string {
  if (!dateStr) return "Bientôt";
  const diff = new Date(dateStr).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Dès maintenant";
  if (days === 1) return "Demain";
  return `Dans ${days} jours`;
}

function urgencyLabel(level: UrgencyLevel): string {
  switch (level) {
    case "critical": return "CRITIQUE";
    case "high": return "URGENCE";
    case "medium": return "IMPORTANT";
    default: return "ALERTE";
  }
}

// ── Component ──────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [alerts, setAlerts] = useState<UrgentAlert[]>([]);
  const [stats, setStats] = useState<DonorStats | null>(null);
  const [nextAppt, setNextAppt] = useState<NextAppointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const promises: Promise<any>[] = [getUrgentAlerts(5)];
      if (user?.id) {
        promises.push(getUnreadCount(user.id));
        promises.push(getDonorStats(user.id));
        promises.push(getNextAppointment(user.id));
      }

      const results = await Promise.allSettled(promises);
      const [alertsResult, unreadResult, statsResult, apptResult] = results;

      if (alertsResult.status === "fulfilled") setAlerts(alertsResult.value);
      if (unreadResult?.status === "fulfilled") setUnreadCount(unreadResult.value);
      if (statsResult?.status === "fulfilled") setStats(statsResult.value);
      if (apptResult?.status === "fulfilled") setNextAppt(apptResult.value);
    } catch (err) {
      console.error("Erreur chargement dashboard:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const topAlert = alerts[0];

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

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#b80035" />
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-4"
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} colors={["#b80035"]} />}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {/* Urgent Alert Card — dynamic */}
          {topAlert ? (
            <View className="bg-surface-container-lowest rounded-2xl p-5 mb-4 shadow-sm border border-black/5">
              <View className="flex-row items-center gap-1.5 mb-3">
                <View className="flex-row items-center gap-1 px-3 py-1 rounded-full" style={{ backgroundColor: getUrgencyColor(topAlert.urgencyLevel) + "15" }}>
                  <MaterialIcons name="emergency" size={12} color={getUrgencyColor(topAlert.urgencyLevel)} />
                  <Text className="text-[10px] font-bold uppercase tracking-wider" style={{ color: getUrgencyColor(topAlert.urgencyLevel) }}>
                    {urgencyLabel(topAlert.urgencyLevel)}
                  </Text>
                </View>
                <View className="bg-primary/10 px-2.5 py-1 rounded-full">
                  <Text className="text-[10px] font-extrabold text-primary">{topAlert.bloodType}</Text>
                </View>
              </View>

              <View className="flex-row justify-between items-start gap-3">
                <View className="flex-1">
                  <Text className="text-xl font-extrabold text-on-surface leading-tight">
                    URGENT: {topAlert.bloodType} Recherché
                  </Text>
                  <Text className="text-sm text-on-surface-variant mt-1" numberOfLines={2}>
                    {topAlert.centerName}{topAlert.centerCity ? `, ${topAlert.centerCity}` : ""}
                  </Text>
                  {topAlert.message ? (
                    <Text className="text-xs text-on-surface-variant/70 mt-1" numberOfLines={2}>
                      {topAlert.message}
                    </Text>
                  ) : null}
                </View>
                <View className="w-16 h-16 rounded-xl bg-surface-container-high items-center justify-center">
                  <MaterialIcons name="local-hospital" size={28} color="#006591" />
                </View>
              </View>

              <View className="flex-row gap-3 mt-4">
                <Pressable
                  className="flex-1 bg-primary/10 p-3 rounded-xl flex-row items-center justify-center gap-1 active:bg-primary/20"
                  onPress={() => router.push("/booking" as any)}
                >
                  <MaterialIcons name="volunteer-activism" size={16} color="#b80035" />
                  <Text className="text-[10px] font-bold text-primary uppercase">
                    Je donne
                  </Text>
                </Pressable>
                <Pressable className="flex-1 bg-secondary/10 p-3 rounded-xl flex-row items-center justify-center gap-1 active:bg-secondary/20">
                  <MaterialIcons name="share" size={16} color="#006591" />
                  <Text className="text-[10px] font-bold text-secondary uppercase">
                    Partager
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View className="bg-surface-container-low rounded-2xl p-5 mb-4 items-center">
              <MaterialIcons name="check-circle" size={32} color="#006847" />
              <Text className="text-sm font-semibold text-on-surface mt-2">Aucune alerte active</Text>
              <Text className="text-xs text-on-surface-variant mt-1">Les demandes urgentes apparaîtront ici.</Text>
            </View>
          )}

          {/* More alerts carousel */}
          {alerts.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4 -mx-4 px-4">
              {alerts.slice(1).map((alert) => (
                <View key={alert.id} className="min-w-[200px] bg-surface-container-lowest p-4 rounded-2xl mr-3 border border-black/5">
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="w-9 h-9 rounded-full items-center justify-center" style={{ backgroundColor: getUrgencyColor(alert.urgencyLevel) + "15" }}>
                      <Text className="text-xs font-extrabold" style={{ color: getUrgencyColor(alert.urgencyLevel) }}>{alert.bloodType}</Text>
                    </View>
                    <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: getUrgencyColor(alert.urgencyLevel) + "15" }}>
                      <Text className="text-[8px] font-bold uppercase" style={{ color: getUrgencyColor(alert.urgencyLevel) }}>
                        {urgencyLabel(alert.urgencyLevel)}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-sm font-bold text-on-surface" numberOfLines={1}>{alert.centerName}</Text>
                  <Text className="text-xs text-on-surface-variant mt-0.5" numberOfLines={1}>{alert.centerCity}</Text>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Next Appointment */}
          {nextAppt && (
            <Pressable
              className="bg-secondary/10 rounded-2xl p-4 mb-4 flex-row items-center gap-3 active:bg-secondary/20"
              onPress={() => router.push("/appointments" as any)}
            >
              <View className="w-10 h-10 bg-secondary/20 rounded-xl items-center justify-center">
                <MaterialIcons name="event" size={20} color="#006591" />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-on-surface-variant uppercase font-bold">Prochain rendez-vous</Text>
                <Text className="text-sm font-bold text-on-surface">{formatDateShort(nextAppt.scheduledDate)}</Text>
                <Text className="text-xs text-on-surface-variant" numberOfLines={1}>{nextAppt.centerName}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#5c3f40" />
            </Pressable>
          )}

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

          {/* Stats — dynamic */}
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
              <Text className="text-2xl font-extrabold text-on-surface">{stats?.donationCount ?? 0}</Text>
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
              <Text className="text-2xl font-extrabold text-on-surface">{stats?.livesSaved ?? 0}</Text>
            </View>
          </View>

          {/* Next Donation — dynamic */}
          <View className="bg-primary p-5 rounded-2xl shadow-lg shadow-primary/20">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-white/80 text-xs uppercase font-bold tracking-wider mb-1">
                  Prochain don possible
                </Text>
                <Text className="text-white text-xl font-extrabold">
                  {daysUntil(stats?.nextDonationDate ?? null)}
                </Text>
                {stats?.lastDonationDate ? (
                  <Text className="text-white/70 text-xs mt-1">
                    Dernier don: {formatDateShort(stats.lastDonationDate)}
                  </Text>
                ) : (
                  <Text className="text-white/70 text-xs mt-1">
                    Premier don ? Prenez rendez-vous !
                  </Text>
                )}
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
      )}
    </SafeAreaView>
  );
}
