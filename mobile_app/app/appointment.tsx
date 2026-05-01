import { useState, useEffect } from "react";
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
import { createAppointment, type AppointmentSlot } from "@/services/appointments";

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

function generateTimeSlots(): AppointmentSlot[] {
  const slots: AppointmentSlot[] = [];
  const today = new Date();
  
  // Générer des créneaux pour les 7 prochains jours
  for (let day = 0; day < 7; day++) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() + day);
    
    // Générer des créneaux horaires (8h-18h)
    for (let hour = 8; hour <= 17; hour++) {
      const date = new Date(currentDate);
      date.setHours(hour, 0, 0, 0);
      
      slots.push({
        id: `${date.getTime()}`,
        date: date.toISOString(),
        time: date.toLocaleTimeString("fr-FR", { 
          hour: "2-digit", 
          minute: "2-digit" 
        }),
        available: Math.random() > 0.3, // 70% de disponibilité
        centerId: "", // Sera rempli plus tard
      });
    }
  }
  
  return slots;
}

export default function AppointmentScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { alertId } = useLocalSearchParams<{ alertId: string }>();
  
  const [alert, setAlert] = useState<Alert | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlot | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AppointmentSlot[]>([]);
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
        
        // Générer des créneaux disponibles
        const slots = generateTimeSlots();
        setAvailableSlots(slots.filter(slot => slot.available));
      } catch (error) {
        showToast("Impossible de charger l'alerte", "error");
      } finally {
        setLoading(false);
      }
    };

    void loadAlert();
  }, [alertId]);

  const handleSlotSelect = (slot: AppointmentSlot) => {
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
    const canDonateNow = !user.last_donation || 
      new Date(user.last_donation).getTime() < Date.now() - 
      (user.gender === "female" ? 90 * 24 * 60 * 60 * 1000 : 60 * 24 * 60 * 60 * 1000);

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
    NativeAlert.alert(
      "Confirmer le rendez-vous",
      `Êtes-vous sûr de vouloir prendre rendez-vous le ${new Date(selectedSlot.date).toLocaleDateString("fr-FR")} à ${selectedSlot.time} pour un don de groupe ${alert.blood_type_required} ?`,
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
      await createAppointment(user.id, {
        alertId: alert.id,
        centerId: alert.center_id,
        scheduledDate: selectedSlot.date,
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

        {/* Time Slots */}
        <View className="bg-surface-container-lowest rounded-2xl p-5 mb-4 border border-black/5">
          <Text className="text-sm font-bold text-on-surface mb-3">
            Choisissez un créneau horaire
          </Text>
          
          <View className="space-y-3">
            {availableSlots.slice(0, 20).map((slot) => {
              const isSelected = selectedSlot?.id === slot.id;
              const slotDate = new Date(slot.date);
              const isToday = slotDate.toDateString() === new Date().toDateString();
              
              return (
                <Pressable
                  key={slot.id}
                  onPress={() => handleSlotSelect(slot)}
                  className={`p-3 rounded-xl border ${
                    isSelected 
                      ? "bg-primary border-primary" 
                      : "bg-surface-container-highest border-black/5"
                  } active:scale-[0.98]`}
                >
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className={`font-semibold ${
                        isSelected ? "text-white" : "text-on-surface"
                      }`}>
                        {isToday ? "Aujourd'hui" : slotDate.toLocaleDateString("fr-FR", {
                          weekday: "short",
                          day: "numeric",
                          month: "short"
                        })}
                      </Text>
                      <Text className={`text-sm ${
                        isSelected ? "text-white/80" : "text-on-surface-variant"
                      }`}>
                        {slot.time}
                      </Text>
                    </View>
                    <View className={`w-5 h-5 rounded-full border-2 ${
                      isSelected 
                        ? "bg-white border-white" 
                        : "border-surface-container-high"
                    }`}>
                      {isSelected && (
                        <View className="w-full h-full rounded-full bg-primary flex items-center justify-center">
                          <MaterialIcons name="check" size={12} color="#ffffff" />
                        </View>
                      )}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Booking Button */}
        <Button
          onPress={handleBooking}
          loading={bookingLoading}
          disabled={!selectedSlot}
          className="w-full mb-4"
        >
          {selectedSlot 
            ? `Confirmer le ${new Date(selectedSlot.date).toLocaleDateString("fr-FR")} à ${selectedSlot.time}`
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
