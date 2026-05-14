import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert as NativeAlert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import Toast, { type ToastType } from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import { getAlert, type Alert } from "@/services/alerts";
import {
  createAppointment,
  generateTimeSlots,
  getBookedSlots,
  type TimeSlot,
} from "@/services/appointments";
import DateTimePicker from "@react-native-community/datetimepicker";

function getUrgencyColor(urgency: Alert["urgency_level"]) {
  switch (urgency) {
    case "low":
      return "#006847";
    case "medium":
      return "#f59e0b";
    case "high":
      return "#dc2626";
    case "critical":
      return "#b80035";
    default:
      return "#006847";
  }
}

function getUrgencyLabel(urgency: Alert["urgency_level"]) {
  switch (urgency) {
    case "low":
      return "Faible";
    case "medium":
      return "Moyenne";
    case "high":
      return "Élevée";
    case "critical":
      return "Critique";
    default:
      return "Faible";
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AppointmentScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { alertId } = useLocalSearchParams<{ alertId: string }>();
  
  const [alert, setAlert] = useState<Alert | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  
  // Sélection de date et créneaux
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: ToastType }>({
    visible: false,
    message: "",
    type: "info",
  });

  const showToast = (message: string, type: ToastType) => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, visible: false }));
  };

  // Quand la date change, recalculer les créneaux
  const refreshSlots = useCallback(async () => {
    if (!alert) return;
    const generated = generateTimeSlots(selectedDate);
    try {
      const dateStr = selectedDate.toISOString().split("T")[0];
      const booked = await getBookedSlots(alert.center_id, dateStr);
      const updated = generated.map((s) => ({
        ...s,
        available: !booked.includes(s.label),
      }));
      setSlots(updated);
    } catch {
      setSlots(generated);
    }
    setSelectedSlot(null);
  }, [alert, selectedDate]);

  useEffect(() => {
    if (!alertId) {
      showToast("ID d'alerte manquant", "error");
      router.back();
      return;
    }

    const loadAlert = async () => {
      try {
        const alertData = await getAlert(alertId);
        if (!alertData) {
          showToast("Alerte non trouvée", "error");
          router.back();
          return;
        }
        
        setAlert(alertData);
      } catch (error) {
        showToast("Impossible de charger l'alerte", "error");
      } finally {
        setLoading(false);
      }
    };

    void loadAlert();
  }, [alertId]);

  useEffect(() => {
    if (alert) refreshSlots();
  }, [alert, refreshSlots]);

  const handleDateChange = (_event: unknown, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
  };

  const handleBooking = async () => {
    if (!selectedSlot || !alert || !user) {
      showToast("Veuillez sélectionner un créneau", "warning");
      return;
    }

    // Vérifications d'éligibilité
    if (!user.blood_type || !user.gender) {
      showToast("Veuillez compléter votre profil d'abord", "warning");
      router.push("/(tabs)/profile");
      return;
    }

    const isCompatible = user.blood_type === alert.blood_type_required;
    const canDonateNow = !user.next_donation_date || 
      new Date(user.next_donation_date) <= new Date();

    if (!isCompatible) {
      showToast(`Votre groupe ${user.blood_type} n'est pas compatible avec ${alert.blood_type_required}`, "error");
      return;
    }

    if (!canDonateNow) {
      const requiredMonths = user.gender === "female" ? 3 : 2;
      showToast(`Vous devez attendre ${requiredMonths} mois après votre dernier don`, "error");
      return;
    }

    // Confirmation
    const appointmentDate = new Date(selectedDate);
    appointmentDate.setHours(selectedSlot.hour, selectedSlot.minute, 0, 0);
    
    NativeAlert.alert(
      "Confirmer le rendez-vous",
      `Êtes-vous sûr de vouloir prendre rendez-vous le ${appointmentDate.toLocaleDateString("fr-FR")} à ${selectedSlot.label} pour un don de groupe ${alert.blood_type_required} ?`,
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Confirmer", 
          onPress: () => void confirmBooking()
        }
      ]
    );
  };

  const confirmBooking = async () => {
    if (!selectedSlot || !alert || !user) return;

    setBookingLoading(true);
    try {
      const appointmentDate = new Date(selectedDate);
      appointmentDate.setHours(selectedSlot.hour, selectedSlot.minute, 0, 0);
      
      await createAppointment(user.id, {
        alertId: alert.id,
        centerId: alert.center_id,
        scheduledDate: appointmentDate.toISOString(),
      });

      showToast("Rendez-vous confirmé avec succès !", "success");
      
      // Rediriger vers la page des rendez-vous
      setTimeout(() => {
        router.push("/appointments" as any);
      }, 1500);
    } catch (error) {
      showToast("Impossible de prendre rendez-vous", "error");
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-surface">
        <View className="flex-1 items-center justify-center px-8">
          <MaterialIcons name="event" size={48} color="#906f70" />
          <Text className="text-lg font-bold text-on-surface mt-4 mb-2">
            Chargement...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!alert) {
    return (
      <SafeAreaView className="flex-1 bg-surface">
        <View className="flex-1 items-center justify-center px-8">
          <MaterialIcons name="error-outline" size={48} color="#ba1a1a" />
          <Text className="text-lg font-bold text-on-surface mt-4 mb-2">
            Erreur
          </Text>
          <Text className="text-sm text-on-surface-variant text-center mb-4">
            Impossible de charger les détails de l'alerte
          </Text>
          <Pressable
            onPress={() => router.back()}
            className="bg-primary px-6 py-3 rounded-xl"
          >
            <Text className="text-white font-semibold">Retour</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onDismiss={hideToast}
      />
      
      {/* Header */}
      <View className="flex-row items-center gap-3 px-6 py-4 border-b border-black/5">
        <Pressable onPress={() => router.back()} className="p-2">
          <MaterialIcons name="arrow-back" size={24} color="#1a1c1e" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-lg font-bold text-on-surface">Prendre rendez-vous</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Alert Summary */}
        <View className="bg-surface-container-lowest rounded-2xl p-5 mb-4 shadow-sm border border-black/5">
          <View className="flex-row items-center gap-2 mb-3">
            <View 
              className="px-2 py-1 rounded-full"
              style={{ backgroundColor: `${getUrgencyColor(alert.urgency_level)}20` }}
            >
              <Text 
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: getUrgencyColor(alert.urgency_level) }}
              >
                {getUrgencyLabel(alert.urgency_level)}
              </Text>
            </View>
            <View className="bg-tertiary-container/20 px-2 py-1 rounded-full">
              <Text className="text-[10px] font-bold text-tertiary">
                {alert.blood_type_required}
              </Text>
            </View>
          </View>

          <Text className="text-lg font-extrabold text-on-surface leading-tight mb-2">
            Urgent: Donneurs {alert.blood_type_required} recherchés
          </Text>
          
          <View className="flex-row items-center gap-2 mb-2">
            <MaterialIcons name="local-hospital" size={16} color="#006591" />
            <Text className="text-sm text-on-surface">{alert.center_name}</Text>
          </View>
          
          <View className="flex-row items-center gap-4 mb-2">
            <View className="flex-row items-center gap-1">
              <MaterialIcons name="location-on" size={14} color="#b80035" />
              <Text className="text-xs text-on-surface-variant">{alert.radius_km}km</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <MaterialIcons name="schedule" size={14} color="#f59e0b" />
              <Text className="text-xs text-on-surface-variant">
                {formatDate(alert.deadline)}
              </Text>
            </View>
          </View>
          
          <Text className="text-sm text-on-surface-variant">
            {alert.message}
          </Text>
        </View>

        {/* User Eligibility */}
        {user?.blood_type && (
          <View className="bg-green-50 rounded-2xl p-4 mb-4 border border-green-100">
            <View className="flex-row items-center gap-2 mb-2">
              <MaterialIcons name="check-circle" size={20} color="#006847" />
              <Text className="text-sm font-semibold text-green-800">
                Vous êtes éligible pour ce don
              </Text>
            </View>
            <Text className="text-xs text-green-700">
              Groupe {user.blood_type} compatible avec {alert.blood_type_required}
            </Text>
          </View>
        )}

        {/* Date picker */}
        <View className="bg-surface-container-lowest rounded-2xl p-4 mb-4 border border-black/5">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base font-bold text-on-surface">Choisir une date</Text>
            <Pressable
              className="flex-row items-center gap-1 bg-surface-container-low px-3 py-2 rounded-xl"
              onPress={() => setShowDatePicker(true)}
            >
              <MaterialIcons name="calendar-today" size={14} color="#b80035" />
              <Text className="text-xs font-bold text-primary">
                {selectedDate.getDate()} {["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"][selectedDate.getMonth()]}
              </Text>
            </Pressable>
          </View>
          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={handleDateChange}
              locale="fr-FR"
            />
          )}
        </View>

        {/* Time Slots */}
        <View className="bg-surface-container-lowest rounded-2xl p-5 mb-4 border border-black/5">
          <Text className="text-sm font-bold text-on-surface mb-3">
            Choisissez un créneau horaire
          </Text>
          
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
                  onPress={() => handleSlotSelect(slot)}
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
        </View>

        {/* Booking Button */}
        <Button
          onPress={handleBooking}
          loading={bookingLoading}
          disabled={!selectedSlot}
          className="w-full mb-4"
        >
          {selectedSlot 
            ? `Confirmer le ${selectedDate.toLocaleDateString("fr-FR")} à ${selectedSlot.label}`
            : "Sélectionnez un créneau horaire"
          }
        </Button>

        {/* Info Section */}
        <View className="bg-tertiary-container/10 rounded-2xl p-4 border border-tertiary/20">
          <View className="flex-row items-center gap-2 mb-2">
            <MaterialIcons name="info" size={16} color="#006847" />
            <Text className="text-sm font-semibold text-tertiary">
              Informations importantes
            </Text>
          </View>
          <Text className="text-xs text-on-surface-variant leading-relaxed">
            - Arrivez 15 minutes avant votre rendez-vous
            - Apportez une pièce d'identité
            - Ne jeûnez pas, mangez normalement
            - Évitez l'alcool 24h avant le don
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
