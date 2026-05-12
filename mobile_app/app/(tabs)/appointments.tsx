import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import {
  getDonorAppointments,
  cancelAppointment,
  type Appointment,
  type AppointmentStatus,
} from "@/services/appointments";

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
      return { label: "En attente", color: "#dd6b20", bgColor: "#fff7ed", icon: "schedule" };
    case "confirmed":
      return { label: "Confirmé", color: "#006847", bgColor: "#ecfdf5", icon: "check-circle" };
    case "cancelled":
      return { label: "Annulé", color: "#b80035", bgColor: "#fff1f2", icon: "cancel" };
    case "completed":
      return { label: "Terminé", color: "#006591", bgColor: "#eff4ff", icon: "verified" };
    default:
      return { label: status, color: "#5c3f40", bgColor: "#eff4ff", icon: "help" };
  }
}

// ── Component ──────────────────────────────────────────────────────────

export default function AppointmentsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"upcoming" | "past">("upcoming");

  const loadAppointments = useCallback(async (showRefresh = false) => {
    if (!user?.id) return;
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getDonorAppointments(user.id);
      setAppointments(data);
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

  // Split appointments
  const upcoming = appointments.filter(
    (a) => !isPast(a.scheduledDate) && a.status !== "cancelled" && a.status !== "completed",
  );
  const past = appointments.filter(
    (a) => isPast(a.scheduledDate) || a.status === "cancelled" || a.status === "completed",
  );

  const displayed = activeFilter === "upcoming" ? upcoming : past;

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <View>
          <Text className="text-2xl font-extrabold text-on-surface">Mes RDV</Text>
          <Text className="text-sm text-on-surface-variant mt-0.5">
            {upcoming.length} rendez-vous à venir
          </Text>
        </View>
        <Pressable className="w-11 h-11 rounded-2xl bg-primary items-center justify-center active:scale-95" onPress={() => router.push("/booking" as any)}>
          <MaterialIcons name="add" size={24} color="#ffffff" />
        </Pressable>
      </View>

      {/* Filter Tabs */}
      <View className="flex-row mx-6 mb-4 bg-surface-container-low rounded-2xl p-1">
        <Pressable
          className={`flex-1 py-2.5 rounded-xl items-center ${activeFilter === "upcoming" ? "bg-surface-container-lowest shadow-sm" : ""}`}
          onPress={() => setActiveFilter("upcoming")}
        >
          <Text
            className={`text-sm font-bold ${activeFilter === "upcoming" ? "text-primary" : "text-on-surface-variant"}`}
          >
            À venir ({upcoming.length})
          </Text>
        </Pressable>
        <Pressable
          className={`flex-1 py-2.5 rounded-xl items-center ${activeFilter === "past" ? "bg-surface-container-lowest shadow-sm" : ""}`}
          onPress={() => setActiveFilter("past")}
        >
          <Text
            className={`text-sm font-bold ${activeFilter === "past" ? "text-primary" : "text-on-surface-variant"}`}
          >
            Passés ({past.length})
          </Text>
        </Pressable>
      </View>

      {/* Content */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#b80035" />
          <Text className="mt-3 text-sm text-on-surface-variant">Chargement de vos rendez-vous...</Text>
        </View>
      ) : displayed.length === 0 ? (
        <EmptyState filter={activeFilter} onBook={() => router.push("/booking" as any)} />
      ) : (
        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadAppointments(true)} colors={["#b80035"]} />}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {displayed.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              onCancel={handleCancel}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ── Appointment Card ────────────────────────────────────────────────────

function AppointmentCard({
  appointment,
  onCancel,
}: {
  appointment: Appointment;
  onCancel: (a: Appointment) => void;
}) {
  const statusConfig = getStatusConfig(appointment.status);
  const dateLabel = isToday(appointment.scheduledDate)
    ? "Aujourd'hui"
    : isTomorrow(appointment.scheduledDate)
      ? "Demain"
      : formatDate(appointment.scheduledDate);

  return (
    <View className="bg-surface-container-lowest rounded-2xl p-4 mb-3 border border-black/5">
      {/* Date header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center">
            <MaterialIcons name="event" size={20} color="#b80035" />
          </View>
          <View>
            <Text className="text-sm font-bold text-on-surface">{dateLabel}</Text>
            <Text className="text-xs text-on-surface-variant">
              {formatTime(appointment.scheduledDate)}
            </Text>
          </View>
        </View>

        {/* Status chip */}
        <View className="flex-row items-center gap-1 px-2.5 py-1 rounded-full" style={{ backgroundColor: statusConfig.bgColor }}>
          <MaterialIcons name={statusConfig.icon as React.ComponentProps<typeof MaterialIcons>["name"]} size={12} color={statusConfig.color} />
          <Text className="text-[10px] font-bold" style={{ color: statusConfig.color }}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      {/* Center info */}
      <View className="bg-surface-container-low rounded-xl p-3 mb-3">
        <View className="flex-row items-center gap-2 mb-1">
          <MaterialIcons name="local-hospital" size={14} color="#006591" />
          <Text className="text-sm font-semibold text-on-surface" numberOfLines={1}>
            {appointment.centerName}
          </Text>
        </View>
        {appointment.centerAddress ? (
          <View className="flex-row items-center gap-2 ml-0.5">
            <MaterialIcons name="location-on" size={12} color="#5c3f40" />
            <Text className="text-xs text-on-surface-variant" numberOfLines={1}>
              {appointment.centerAddress}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Notes */}
      {appointment.notes ? (
        <Text className="text-xs text-on-surface-variant mb-3 italic" numberOfLines={2}>
          {appointment.notes}
        </Text>
      ) : null}

      {/* Actions */}
      {(appointment.status === "pending" || appointment.status === "confirmed") && !isPast(appointment.scheduledDate) && (
        <View className="flex-row gap-2">
          <Pressable
            className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl bg-surface-container-low active:bg-surface-container"
            onPress={() => onCancel(appointment)}
          >
            <MaterialIcons name="close" size={14} color="#b80035" />
            <Text className="text-xs font-bold text-primary">Annuler</Text>
          </Pressable>
          <Pressable className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary/10 active:bg-primary/20">
            <MaterialIcons name="phone" size={14} color="#b80035" />
            <Text className="text-xs font-bold text-primary">Appeler</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ── Empty State ─────────────────────────────────────────────────────────

function EmptyState({ filter, onBook }: { filter: "upcoming" | "past"; onBook: () => void }) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <View className="w-20 h-20 bg-surface-container-low rounded-3xl items-center justify-center mb-4">
        <MaterialIcons
          name={filter === "upcoming" ? "event-available" : "history"}
          size={36}
          color="#5c3f40"
        />
      </View>
      <Text className="text-lg font-bold text-on-surface text-center mb-1">
        {filter === "upcoming" ? "Aucun rendez-vous à venir" : "Aucun rendez-vous passé"}
      </Text>
      <Text className="text-sm text-on-surface-variant text-center max-w-[260px]">
        {filter === "upcoming"
          ? "Prenez un rendez-vous dans un centre de don pour sauver des vies."
          : "Vos rendez-vous passés apparaîtront ici."}
      </Text>
      {filter === "upcoming" && (
        <Pressable className="mt-5 bg-primary px-6 py-3 rounded-full active:scale-95" onPress={onBook}>
          <Text className="text-sm font-bold text-white">Prendre un RDV</Text>
        </Pressable>
      )}
    </View>
  );
}
