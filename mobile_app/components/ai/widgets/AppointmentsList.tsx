import { View, Text, Pressable, Alert } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface Appointment {
  id: string;
  scheduled_date: string;
  status: "pending" | "confirmed" | "cancelled";
  notes?: string;
  alert_id?: string;
  centers?: {
    name: string;
    address: string;
    city: string;
    phone: string;
  };
}

interface Props {
  data: string | Appointment[] | { appointment: Appointment | null };
  onSendMessage?: (text: string) => void;
}

function getStatusStyles(status: Appointment["status"]) {
  switch (status) {
    case "confirmed":
      return {
        bg: "bg-emerald-50 border-emerald-100",
        text: "text-emerald-700",
        label: "Confirmé",
        icon: "check-circle",
        color: "#059669",
      };
    case "cancelled":
      return {
        bg: "bg-gray-100 border-gray-200",
        text: "text-gray-500",
        label: "Annulé",
        icon: "cancel",
        color: "#6b7280",
      };
    default:
      return {
        bg: "bg-amber-50 border-amber-100",
        text: "text-amber-700",
        label: "En attente",
        icon: "hourglass-empty",
        color: "#d97706",
      };
  }
}

export default function AppointmentsList({ data, onSendMessage }: Props) {
  let appointments: Appointment[] = [];

  try {
    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    if (parsed && typeof parsed === "object" && "appointment" in parsed) {
      if (parsed.appointment) {
        appointments = [parsed.appointment];
      }
    } else if (Array.isArray(parsed)) {
      appointments = parsed;
    }
  } catch {
    appointments = [];
  }

  if (appointments.length === 0) {
    return (
      <View className="my-2 bg-gray-50 border border-gray-200 rounded-2xl p-4 flex-row items-center shadow-xs">
        <MaterialIcons name="event-busy" size={20} color="#666" />
        <Text className="text-xs text-gray-500 font-semibold ml-2.5">Aucun rendez-vous planifié.</Text>
      </View>
    );
  }

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("fr-FR", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const handleCancel = (appointmentId: string, centerName: string, dateStr: string) => {
    Alert.alert(
      "Annuler le rendez-vous",
      `Êtes-vous sûr de vouloir annuler votre rendez-vous au ${centerName} le ${formatDate(dateStr)} ?`,
      [
        { text: "Non", style: "cancel" },
        {
          text: "Oui, annuler",
          style: "destructive",
          onPress: () => {
            if (onSendMessage) {
              onSendMessage(`Je souhaite annuler mon rendez-vous d'ID: ${appointmentId}`);
            }
          },
        },
      ]
    );
  };

  return (
    <View className="my-2 gap-2.5">
      {appointments.map((apt) => {
        const styles = getStatusStyles(apt.status);
        const centerName = apt.centers?.name ?? "Centre BloodLink";
        const isCancelable = apt.status === "pending" || apt.status === "confirmed";

        return (
          <View key={apt.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs">
            {/* Status header */}
            <View className="flex-row justify-between items-center mb-3">
              <View className="flex-row items-center">
                <MaterialIcons name="event" size={15} color="#555" />
                <Text className="text-gray-900 font-extrabold text-[13px] ml-1.5 capitalize">
                  {formatDate(apt.scheduled_date)}
                </Text>
              </View>
              <View className={`flex-row items-center border px-2 py-0.5 rounded-full ${styles.bg}`}>
                <MaterialIcons name={styles.icon as any} size={11} color={styles.color} />
                <Text className={`text-[10px] font-bold ml-1 ${styles.text}`}>{styles.label}</Text>
              </View>
            </View>

            {/* Center details */}
            <View className="bg-gray-50 border border-black/5 rounded-xl p-3 mb-3">
              <Text className="text-gray-900 font-extrabold text-xs mb-1">{centerName}</Text>
              {apt.centers?.address && (
                <Text className="text-[11px] text-gray-500 leading-[15px]" numberOfLines={2}>
                  {apt.centers.address}, {apt.centers.city}
                </Text>
              )}
            </View>

            {/* Cancel action */}
            {isCancelable && (
              <Pressable
                onPress={() => handleCancel(apt.id, centerName, apt.scheduled_date)}
                className="bg-rose-50 border border-rose-100 py-2.5 rounded-xl justify-center items-center active:bg-rose-100 flex-row gap-1"
              >
                <MaterialIcons name="delete-outline" size={15} color="#b80035" />
                <Text className="text-[#b80035] text-xs font-bold">Annuler ce rendez-vous</Text>
              </Pressable>
            )}
          </View>
        );
      })}
    </View>
  );
}
