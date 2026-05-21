import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StyleSheet,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import {
  getDonorAppointments,
  cancelAppointment,
  type Appointment,
  type AppointmentStatus,
} from "@/services/appointments";
import { supabase } from "@/services/supabase";

// ── Helpers ────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  const months = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function isTomorrow(dateStr: string): boolean {
  const d = new Date(dateStr);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return d.getFullYear() === tomorrow.getFullYear() && d.getMonth() === tomorrow.getMonth() && d.getDate() === tomorrow.getDate();
}

function isPast(dateStr: string): boolean {
  return new Date(dateStr) < new Date();
}

function getStatusConfig(status: AppointmentStatus) {
  switch (status) {
    case "pending":
      return { label: "En attente", color: "#dd6b20", bgColor: "#fff7ed", icon: "schedule" as const };
    case "confirmed":
      return { label: "Confirmé", color: "#006847", bgColor: "#ecfdf5", icon: "check-circle" as const };
    case "cancelled":
      return { label: "Annulé", color: "#b80035", bgColor: "#fff1f2", icon: "cancel" as const };
    case "completed":
      return { label: "Terminé", color: "#006591", bgColor: "#eff4ff", icon: "verified" as const };
    default:
      return { label: status, color: "#5c3f40", bgColor: "#eff4ff", icon: "help" as const };
  }
}

// ── Styles ─────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#ffffff" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingVertical: 16 },
  title: { fontSize: 24, fontWeight: "800", color: "#0f172a" },
  subtitle: { fontSize: 14, color: "#3b4e68", marginTop: 2 },
  addBtn: { width: 44, height: 44, borderRadius: 16, backgroundColor: "#b80035", alignItems: "center", justifyContent: "center" },
  filterRow: { flexDirection: "row", marginHorizontal: 24, marginBottom: 16, backgroundColor: "#fff1f2", borderRadius: 16, padding: 4 },
  filterTab: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: "center" },
  filterTabActive: { backgroundColor: "#ffffff", shadowColor: "#b80035", shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  filterText: { fontSize: 14, fontWeight: "700", color: "#3b4e68" },
  filterTextActive: { color: "#b80035" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 12, fontSize: 14, color: "#3b4e68" },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  emptyIcon: { width: 80, height: 80, backgroundColor: "#fff1f2", borderRadius: 24, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a", textAlign: "center", marginBottom: 4 },
  emptyDesc: { fontSize: 14, color: "#3b4e68", textAlign: "center", maxWidth: 260 },
  bookBtn: { marginTop: 20, backgroundColor: "#b80035", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999 },
  bookBtnText: { fontSize: 14, fontWeight: "700", color: "#ffffff" },
  list: { flex: 1, paddingHorizontal: 24 },
  card: { backgroundColor: "#ffffff", borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "rgba(184,0,53,0.08)" },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  cardDateRow: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  cardIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(184,0,53,0.08)", alignItems: "center", justifyContent: "center" },
  cardDate: { fontSize: 14, fontWeight: "700", color: "#0f172a" },
  cardTime: { fontSize: 12, color: "#3b4e68" },
  statusChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusText: { fontSize: 10, fontWeight: "700" },
  centerBox: { backgroundColor: "#fff8f9", borderRadius: 12, padding: 12, marginBottom: 12 },
  centerRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  centerName: { fontSize: 14, fontWeight: "600", color: "#0f172a", flex: 1 },
  addressRow: { flexDirection: "row", alignItems: "center", gap: 8, marginLeft: 2 },
  addressText: { fontSize: 12, color: "#3b4e68", flex: 1 },
  notes: { fontSize: 12, color: "#3b4e68", marginBottom: 12, fontStyle: "italic" },
  actions: { flexDirection: "row", gap: 8 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 12 },
  cancelBtn: { backgroundColor: "#fff1f2" },
  callBtn: { backgroundColor: "rgba(184,0,53,0.08)" },
  actionText: { fontSize: 12, fontWeight: "700", color: "#b80035" },
});

// ── Component ──────────────────────────────────────────────────────────

export default function AppointmentsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"upcoming" | "past">("upcoming");
  const [nextDonationDate, setNextDonationDate] = useState<string | null>(null);

  const loadAppointments = useCallback(async (showRefresh = false) => {
    if (!user?.id) return;
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getDonorAppointments(user.id);
      setAppointments(data);

      const { data: profile } = await supabase
        .from("profiles")
        .select("next_donation_date")
        .eq("id", user.id)
        .single();
      setNextDonationDate(profile?.next_donation_date ?? null);
    } catch (err) {
      console.error("Erreur chargement RDV:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const handleCancel = (appointment: Appointment) => {
    Alert.alert(
      "Annuler le rendez-vous",
      `Êtes-vous sûr de vouloir annuler votre RDV du ${formatDate(appointment.scheduledDate)} à ${formatTime(appointment.scheduledDate)} ?`,
      [
        { text: "Non", style: "cancel" },
        {
          text: "Oui, annuler",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelAppointment(appointment.id);
              setAppointments((prev) =>
                prev.map((a) => (a.id === appointment.id ? { ...a, status: "cancelled" as AppointmentStatus } : a)),
              );
            } catch {
              Alert.alert("Erreur", "Impossible d'annuler le rendez-vous.");
            }
          },
        },
      ],
    );
  };

  const upcoming = appointments.filter(
    (a) => !isPast(a.scheduledDate) && a.status !== "cancelled" && a.status !== "completed",
  );
  const past = appointments.filter(
    (a) => isPast(a.scheduledDate) || a.status === "cancelled" || a.status === "completed",
  );
  const displayed = activeFilter === "upcoming" ? upcoming : past;

  const handleBook = () => {
    if (nextDonationDate && new Date(nextDonationDate) > new Date()) {
      const daysLeft = Math.ceil((new Date(nextDonationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      Alert.alert("Non éligible", `Vous ne pouvez pas encore donner. Prochain don possible dans ${daysLeft} jour${daysLeft > 1 ? "s" : ""}.`);
      return;
    }
    router.push("/booking" as any);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={s.centered}>
          <ActivityIndicator size="large" color="#b80035" />
          <Text style={s.loadingText}>Chargement de vos rendez-vous...</Text>
        </View>
      );
    }

    if (displayed.length === 0) {
      return (
        <View style={s.emptyWrap}>
          <View style={s.emptyIcon}>
            <MaterialIcons
              name={activeFilter === "upcoming" ? "event-available" : "history"}
              size={36}
              color="#b80035"
            />
          </View>
          <Text style={s.emptyTitle}>
            {activeFilter === "upcoming" ? "Aucun rendez-vous à venir" : "Aucun rendez-vous passé"}
          </Text>
          <Text style={s.emptyDesc}>
            {activeFilter === "upcoming"
              ? "Prenez un rendez-vous dans un centre de don pour sauver des vies."
              : "Vos rendez-vous passés apparaîtront ici."}
          </Text>
          {activeFilter === "upcoming" && (
            <Pressable style={s.bookBtn} onPress={handleBook}>
              <Text style={s.bookBtnText}>Prendre un RDV</Text>
            </Pressable>
          )}
        </View>
      );
    }

    return (
      <ScrollView
        style={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadAppointments(true)} colors={["#b80035"]} />}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {displayed.map((appointment, index) => {
          const statusConfig = getStatusConfig(appointment.status);
          const dateLabel = isToday(appointment.scheduledDate)
            ? "Aujourd'hui"
            : isTomorrow(appointment.scheduledDate)
              ? "Demain"
              : formatDate(appointment.scheduledDate);

          return (
            <Animated.View
              key={appointment.id}
              entering={FadeInDown.delay(index * 100).duration(450)}
              style={s.card}
            >
              <View style={s.cardHeader}>
                <View style={s.cardDateRow}>
                  <View style={s.cardIconBox}>
                    <MaterialIcons name="event" size={20} color="#b80035" />
                  </View>
                  <View>
                    <Text style={s.cardDate}>{dateLabel}</Text>
                    <Text style={s.cardTime}>{formatTime(appointment.scheduledDate)}</Text>
                  </View>
                </View>
                <View style={[s.statusChip, { backgroundColor: statusConfig.bgColor }]}>
                  <MaterialIcons name={statusConfig.icon} size={12} color={statusConfig.color} />
                  <Text style={[s.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
                </View>
              </View>

              <View style={s.centerBox}>
                <View style={s.centerRow}>
                  <MaterialIcons name="local-hospital" size={14} color="#006591" />
                  <Text style={s.centerName} numberOfLines={1}>{appointment.centerName}</Text>
                </View>
                {appointment.centerAddress ? (
                  <View style={s.addressRow}>
                    <MaterialIcons name="location-on" size={12} color="#5c3f40" />
                    <Text style={s.addressText} numberOfLines={1}>{appointment.centerAddress}</Text>
                  </View>
                ) : null}
              </View>

              {appointment.notes ? (
                <Text style={s.notes} numberOfLines={2}>{appointment.notes}</Text>
              ) : null}

              {(appointment.status === "pending" || appointment.status === "confirmed") && !isPast(appointment.scheduledDate) && (
                <View style={s.actions}>
                  <Pressable style={[s.actionBtn, s.cancelBtn]} onPress={() => handleCancel(appointment)}>
                    <MaterialIcons name="close" size={14} color="#b80035" />
                    <Text style={s.actionText}>Annuler</Text>
                  </Pressable>
                  <Pressable style={[s.actionBtn, s.callBtn]}>
                    <MaterialIcons name="phone" size={14} color="#b80035" />
                    <Text style={s.actionText}>Appeler</Text>
                  </Pressable>
                </View>
              )}
            </Animated.View>
          );
        })}
      </ScrollView>
    );
  };

  return (
    <View style={[s.safe, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>Mes RDV</Text>
          <Text style={s.subtitle}>{upcoming.length} rendez-vous à venir</Text>
        </View>
        <Pressable style={s.addBtn} onPress={handleBook}>
          <MaterialIcons name="add" size={24} color="#ffffff" />
        </Pressable>
      </View>

      {/* Filter Tabs */}
      <View style={s.filterRow}>
        <Pressable
          style={[s.filterTab, activeFilter === "upcoming" && s.filterTabActive]}
          onPress={() => setActiveFilter("upcoming")}
        >
          <Text style={[s.filterText, activeFilter === "upcoming" && s.filterTextActive]}>
            À venir ({upcoming.length})
          </Text>
        </Pressable>
        <Pressable
          style={[s.filterTab, activeFilter === "past" && s.filterTabActive]}
          onPress={() => setActiveFilter("past")}
        >
          <Text style={[s.filterText, activeFilter === "past" && s.filterTextActive]}>
            Passés ({past.length})
          </Text>
        </Pressable>
      </View>

      {/* Content */}
      {renderContent()}
    </View>
  );
}
