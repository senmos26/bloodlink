import { View, Text, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface Slot {
  hour: number;
  minute: number;
  label: string;
  available: boolean;
}

interface Props {
  slots: string | Slot[];
  centerId: string;
  date: string;
  onSendMessage?: (text: string) => void;
}

export default function TimeSlotsGrid({ slots, centerId, date, onSendMessage }: Props) {
  let listSlots: Slot[] = [];

  try {
    listSlots = typeof slots === "string" ? JSON.parse(slots) : slots;
  } catch {
    listSlots = [];
  }

  if (!Array.isArray(listSlots) || listSlots.length === 0) {
    return (
      <View className="my-2 p-4 bg-gray-50 rounded-2xl border border-gray-200">
        <Text className="text-xs text-gray-500 text-center">Aucun créneau disponible pour cette date.</Text>
      </View>
    );
  }

  const handleSelectSlot = (label: string) => {
    if (onSendMessage) {
      // Message format that SangBot will parse with createAppointment tool
      onSendMessage(`Je confirme ma réservation pour le créneau de ${label} le ${date} dans le centre ID: ${centerId}`);
    }
  };

  const formatDateLabel = (dateStr: string) => {
    try {
      const d = new Date(`${dateStr}T00:00:00`);
      return d.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <View className="my-2 bg-gray-50 border border-gray-100 rounded-2xl p-4 shadow-xs">
      <View className="flex-row items-center mb-3">
        <MaterialIcons name="calendar-today" size={15} color="#b80035" />
        <Text className="text-gray-900 font-extrabold text-[13px] ml-2 capitalize">
          Créneaux du {formatDateLabel(date)}
        </Text>
      </View>

      <View className="flex-row flex-wrap gap-2">
        {listSlots.map((slot) => (
          <Pressable
            key={slot.label}
            onPress={() => handleSelectSlot(slot.label)}
            className="bg-white border border-gray-200 px-3.5 py-2.5 rounded-xl active:bg-rose-50 active:border-[#b80035] justify-center items-center w-[22%]"
          >
            <Text className="text-gray-800 text-xs font-bold">{slot.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
