import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { getMapCenters, type MapCenter } from "@/services/map";
import {
  createAppointment,
  generateTimeSlots,
  getBookedSlots,
  type TimeSlot,
} from "@/services/appointments";
import DateTimePicker from "@react-native-community/datetimepicker";

// ── Step enum ──────────────────────────────────────────────────────────
type Step = "center" | "date" | "confirm";

// ── Component ──────────────────────────────────────────────────────────
export default function BookingScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState<Step>("center");
  const [centers, setCenters] = useState<MapCenter[]>([]);
  const [loading, setLoading] = useState(true);

  // Sélection
  const [selectedCenter, setSelectedCenter] = useState<MapCenter | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Charger les centres
  useEffect(() => {
    (async () => {
      try {
        const data = await getMapCenters();
        setCenters(data);
      } catch (err) {
        console.error("Erreur chargement centres:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Quand la date change, recalculer les créneaux
  const refreshSlots = useCallback(async () => {
    if (!selectedCenter) return;
    const generated = generateTimeSlots(selectedDate);
    try {
      const dateStr = selectedDate.toISOString().split("T")[0];
      const booked = await getBookedSlots(selectedCenter.id, dateStr);
      const updated = generated.map((s) => ({
        ...s,
        available: !booked.includes(s.label),
      }));
      setSlots(updated);
    } catch {
      setSlots(generated);
    }
    setSelectedSlot(null);
  }, [selectedCenter, selectedDate]);

  useEffect(() => {
    if (step === "date") refreshSlots();
  }, [step, refreshSlots]);

  // Handlers
  const handleDateChange = (_event: unknown, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleConfirm = async () => {
    if (!user?.id || !selectedCenter || !selectedSlot) return;

    setSubmitting(true);
    try {
      const d = new Date(selectedDate);
      d.setHours(selectedSlot.hour, selectedSlot.minute, 0, 0);
      const isoDate = d.toISOString();

      await createAppointment(user.id, {
        centerId: selectedCenter.id,
        scheduledDate: isoDate,
      });

      Alert.alert(
        "Rendez-vous confirmé !",
        `Votre RDV est prévu le ${formatDateShort(d)} à ${selectedSlot.label} au ${selectedCenter.name}.`,
        [{ text: "OK", onPress: () => router.back() }],
      );
    } catch (err) {
      Alert.alert("Erreur", "Impossible de créer le rendez-vous. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header */}
      <View className="flex-row items-center gap-3 px-6 py-4 border-b border-black/5">
        <Pressable onPress={() => (step === "center" ? router.back() : setStep(step === "confirm" ? "date" : "center"))} className="p-1">
          <MaterialIcons name="arrow-back" size={24} color="#0d1c2e" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-lg font-bold text-on-surface">
            {step === "center" && "Choisir un centre"}
            {step === "date" && "Choisir un créneau"}
            {step === "confirm" && "Confirmer le RDV"}
          </Text>
        </View>
        {/* Step indicator */}
        <View className="flex-row gap-1">
          {(["center", "date", "confirm"] as Step[]).map((s, i) => {
            const stepIndex = ["center", "date", "confirm"].indexOf(step);
            return (
              <View
                key={s}
                className="h-1.5 rounded-full"
                style={{
                  width: i <= stepIndex ? 24 : 12,
                  backgroundColor: i <= stepIndex ? "#b80035" : "#e0e2e8",
                }}
              />
            );
          })}
        </View>
      </View>

      {/* Content */}
      {step === "center" && (
        <CenterStep
          centers={centers}
          loading={loading}
          selectedId={selectedCenter?.id ?? null}
          onSelect={(c) => {
            setSelectedCenter(c);
            setStep("date");
          }}
        />
      )}

      {step === "date" && selectedCenter && (
        <DateStep
          center={selectedCenter}
          selectedDate={selectedDate}
          slots={slots}
          selectedSlot={selectedSlot}
          showDatePicker={showDatePicker}
          onShowDatePicker={() => setShowDatePicker(true)}
          onDateChange={handleDateChange}
          onSelectSlot={setSelectedSlot}
          onContinue={() => setStep("confirm")}
        />
      )}

      {step === "confirm" && selectedCenter && selectedSlot && (
        <ConfirmStep
          center={selectedCenter}
          date={selectedDate}
          slot={selectedSlot}
          submitting={submitting}
          onConfirm={handleConfirm}
        />
      )}
    </SafeAreaView>
  );
}

// ── Center Step ────────────────────────────────────────────────────────

function CenterStep({
  centers,
  loading,
  selectedId,
  onSelect,
}: {
  centers: MapCenter[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (c: MapCenter) => void;
}) {
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#b80035" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
      <Text className="text-sm text-on-surface-variant mb-4">
        Sélectionnez le centre où vous souhaitez donner votre sang.
      </Text>
      {centers.map((center) => {
        const isSelected = center.id === selectedId;
        return (
          <Pressable
            key={center.id}
            className={`flex-row items-center gap-3 p-4 rounded-2xl mb-3 border ${isSelected ? "bg-primary/5 border-primary/30" : "bg-surface-container-lowest border-black/5"}`}
            onPress={() => onSelect(center)}
            style={isSelected ? { borderLeftWidth: 3, borderLeftColor: "#b80035" } : undefined}
          >
            <View className="w-10 h-10 rounded-xl bg-secondary/10 items-center justify-center">
              <MaterialIcons name="local-hospital" size={20} color="#006591" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-on-surface" numberOfLines={1}>
                {center.name}
              </Text>
              <Text className="text-xs text-on-surface-variant" numberOfLines={1}>
                {center.address}, {center.city}
              </Text>
            </View>
            {center.activeAlertCount > 0 && (
              <View className="bg-primary/10 px-2 py-0.5 rounded-full">
                <Text className="text-[9px] font-bold text-primary">{center.activeAlertCount} alerte{center.activeAlertCount > 1 ? "s" : ""}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// ── Date Step ───────────────────────────────────────────────────────────

function DateStep({
  center,
  selectedDate,
  slots,
  selectedSlot,
  showDatePicker,
  onShowDatePicker,
  onDateChange,
  onSelectSlot,
  onContinue,
}: {
  center: MapCenter;
  selectedDate: Date;
  slots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  showDatePicker: boolean;
  onShowDatePicker: () => void;
  onDateChange: (event: unknown, date?: Date) => void;
  onSelectSlot: (slot: TimeSlot) => void;
  onContinue: () => void;
}) {
  const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

  return (
    <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
      {/* Center recap */}
      <View className="flex-row items-center gap-2 bg-surface-container-low rounded-xl p-3 mb-4">
        <MaterialIcons name="local-hospital" size={16} color="#006591" />
        <Text className="text-xs font-semibold text-on-surface" numberOfLines={1}>{center.name}</Text>
      </View>

      {/* Date picker */}
      <View className="bg-surface-container-lowest rounded-2xl p-4 mb-4 border border-black/5">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-base font-bold text-on-surface">Choisir une date</Text>
          <Pressable
            className="flex-row items-center gap-1 bg-surface-container-low px-3 py-2 rounded-xl"
            onPress={onShowDatePicker}
          >
            <MaterialIcons name="calendar-today" size={14} color="#b80035" />
            <Text className="text-xs font-bold text-primary">
              {selectedDate.getDate()} {months[selectedDate.getMonth()]}
            </Text>
          </Pressable>
        </View>
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            minimumDate={new Date()}
            onChange={onDateChange}
            locale="fr-FR"
          />
        )}
      </View>

      {/* Time slots */}
      <Text className="text-base font-bold text-on-surface mb-3">Choisir un horaire</Text>
      {slots.length === 0 ? (
        <View className="items-center py-8">
          <MaterialIcons name="schedule" size={32} color="#5c3f40" />
          <Text className="text-sm text-on-surface-variant mt-2">Aucun créneau disponible pour cette date.</Text>
        </View>
      ) : (
        <View className="flex-row flex-wrap gap-2 mb-6">
          {slots.map((slot) => (
            <Pressable
              key={slot.label}
              className={`py-2.5 px-4 rounded-xl ${!slot.available ? "bg-surface-container opacity-40" : selectedSlot?.label === slot.label ? "bg-primary/10 border-2 border-primary" : "bg-surface-container-low"}`}
              disabled={!slot.available}
              onPress={() => onSelectSlot(slot)}
            >
              <Text
                className={`text-xs font-bold ${!slot.available ? "text-on-surface-variant" : selectedSlot?.label === slot.label ? "text-primary" : "text-on-surface"}`}
              >
                {slot.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Continue */}
      {selectedSlot && (
        <Pressable
          className="bg-primary py-4 rounded-2xl items-center active:scale-[0.98]"
          onPress={onContinue}
        >
          <Text className="text-sm font-bold text-white">Continuer</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

// ── Confirm Step ────────────────────────────────────────────────────────

function ConfirmStep({
  center,
  date,
  slot,
  submitting,
  onConfirm,
}: {
  center: MapCenter;
  date: Date;
  slot: TimeSlot;
  submitting: boolean;
  onConfirm: () => void;
}) {
  const d = new Date(date);
  d.setHours(slot.hour, slot.minute);

  return (
    <View className="flex-1 px-6 pt-4">
      {/* Recap card */}
      <View className="bg-surface-container-lowest rounded-2xl p-5 border border-black/5 mb-6">
        <View className="items-center mb-4">
          <View className="w-16 h-16 bg-primary/10 rounded-2xl items-center justify-center mb-3">
            <MaterialIcons name="event-available" size={32} color="#b80035" />
          </View>
          <Text className="text-lg font-bold text-on-surface">Résumé du rendez-vous</Text>
        </View>

        <View className="space-y-3">
          <View className="flex-row items-center gap-3">
            <View className="w-8 h-8 bg-secondary/10 rounded-lg items-center justify-center">
              <MaterialIcons name="local-hospital" size={16} color="#006591" />
            </View>
            <View className="flex-1">
              <Text className="text-[10px] text-on-surface-variant uppercase font-bold">Centre</Text>
              <Text className="text-sm font-semibold text-on-surface">{center.name}</Text>
            </View>
          </View>

          <View className="flex-row items-center gap-3">
            <View className="w-8 h-8 bg-primary/10 rounded-lg items-center justify-center">
              <MaterialIcons name="calendar-today" size={16} color="#b80035" />
            </View>
            <View className="flex-1">
              <Text className="text-[10px] text-on-surface-variant uppercase font-bold">Date</Text>
              <Text className="text-sm font-semibold text-on-surface">{formatDateShort(d)}</Text>
            </View>
          </View>

          <View className="flex-row items-center gap-3">
            <View className="w-8 h-8 bg-tertiary/10 rounded-lg items-center justify-center">
              <MaterialIcons name="schedule" size={16} color="#006847" />
            </View>
            <View className="flex-1">
              <Text className="text-[10px] text-on-surface-variant uppercase font-bold">Heure</Text>
              <Text className="text-sm font-semibold text-on-surface">{slot.label}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Info */}
      <View className="bg-surface-container-low rounded-xl p-3 mb-6 flex-row gap-2">
        <MaterialIcons name="info" size={16} color="#006591" />
        <Text className="text-xs text-on-surface-variant flex-1">
          Votre rendez-vous sera en attente de confirmation par le centre. Vous recevrez une notification dès qu'il sera confirmé.
        </Text>
      </View>

      {/* CTA */}
      <Pressable
        className={`py-4 rounded-2xl items-center ${submitting ? "bg-primary/50" : "bg-primary"} active:scale-[0.98]`}
        onPress={onConfirm}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text className="text-sm font-bold text-white">Confirmer le rendez-vous</Text>
        )}
      </Pressable>
    </View>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────

function formatDateShort(d: Date): string {
  const days = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  const months = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}
