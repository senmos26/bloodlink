import { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import Toast, { type ToastType } from "@/components/ui/Toast";
import { getAlerts, type Alert } from "@/services/alerts";

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

function isBloodTypeCompatible(userType: string, requiredType: string): boolean {
  // Logique de compatibilité des groupes sanguins
  if (userType === requiredType) return true;
  
  // Donneurs universels
  if (userType === "O-") return true;
  if (userType === "O+" && requiredType.includes("+")) return true;
  
  // Receveurs universels
  if (requiredType === "AB+" && userType.includes("+")) return true;
  if (requiredType === "AB-") return true;
  
  // Compatibilité Rhésus
  if (userType.includes("-") && requiredType.includes("-")) {
    return userType[0] === requiredType[0];
  }
  
  if (userType.includes("+") && requiredType.includes("+")) {
    return userType[0] === requiredType[0];
  }
  
  return false;
}

function canDonate(nextDonationDate: string | null | undefined, gender: string): boolean {
  if (!nextDonationDate) return true;
  
  const nextDate = new Date(nextDonationDate);
  const now = new Date();
  
  // Si la prochaine date de don est passée, on peut donner
  return now >= nextDate;
}

export default function AlertsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  const loadAlerts = async (isRefreshing = false) => {
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await getAlerts();
      setAlerts(data);
    } catch (error) {
      showToast("Impossible de charger les alertes", "error");
    } finally {
      if (isRefreshing) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadAlerts();
  }, []);

  const handleAlertPress = (alert: Alert) => {
    if (!user?.blood_type || !user?.gender) {
      showToast("Veuillez compléter votre profil d'abord", "warning");
      router.push("/(tabs)/profile");
      return;
    }

    const isCompatible = isBloodTypeCompatible(user.blood_type, alert.blood_type_required);
    const canDonateNow = canDonate(user.next_donation_date, user.gender);

    if (!isCompatible) {
      showToast(`Votre groupe ${user.blood_type} n'est pas compatible avec ${alert.blood_type_required}`, "error");
      return;
    }

    if (!canDonateNow) {
      showToast(`Vous n'êtes pas encore éligible pour donner. Vérifiez votre prochaine date de don possible dans votre profil.`, "warning");
      return;
    }

    // Navigation vers la page de prise de rendez-vous
    router.push(`/appointment?alertId=${alert.id}`);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-surface">
        <View className="flex-1 items-center justify-center px-8">
          <MaterialIcons name="notifications" size={48} color="#906f70" />
          <Text className="text-lg font-bold text-on-surface mt-4 mb-2">
            Chargement des alertes...
          </Text>
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
          <Text className="text-lg font-bold text-on-surface">Alertes actives</Text>
        </View>
        <View className="bg-primary/10 px-2 py-1 rounded-full">
          <Text className="text-xs font-bold text-primary">{alerts.length}</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void loadAlerts(true)} />
        }
      >
        {alerts.length === 0 ? (
          <View className="flex-1 items-center justify-center py-12">
            <MaterialIcons name="notifications-off" size={48} color="#906f70" />
            <Text className="text-lg font-bold text-on-surface mt-4 mb-2">
              Aucune alerte active
            </Text>
            <Text className="text-sm text-on-surface-variant text-center">
              Revenez plus tard pour voir les nouvelles alertes de besoin de sang
            </Text>
          </View>
        ) : (
          <View className="space-y-3">
            {alerts.map((alert) => {
              const isCompatible = user?.blood_type ? 
                isBloodTypeCompatible(user.blood_type, alert.blood_type_required) : false;
              const canDonateNow = user?.next_donation_date && user?.gender ? 
                canDonate(user.next_donation_date, user.gender) : true;
              const isEligible = isCompatible && canDonateNow;

              return (
                <Pressable
                  key={alert.id}
                  onPress={() => handleAlertPress(alert)}
                  className={`p-4 rounded-2xl border ${
                    isEligible 
                      ? "bg-surface-container-lowest border-primary/20" 
                      : "bg-surface-container-highest border-black/5"
                  } active:scale-[0.98]`}
                >
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2 mb-2">
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
                    </View>
                    <View className="flex-row items-center gap-1">
                      {isEligible ? (
                        <View className="bg-green-100 px-2 py-1 rounded-full">
                          <Text className="text-[10px] font-bold text-green-700">
                            ÉLIGIBLE
                          </Text>
                        </View>
                      ) : (
                        <View className="bg-orange-100 px-2 py-1 rounded-full">
                          <Text className="text-[10px] font-bold text-orange-700">
                            NON ÉLIGIBLE
                          </Text>
                        </View>
                      )}
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

                  {!isEligible && user?.blood_type && (
                    <View className="mt-3 p-2 bg-orange-50 rounded-lg">
                      <Text className="text-xs text-orange-800">
                        {!isCompatible 
                          ? `Votre groupe ${user.blood_type} n'est pas compatible`
                          : `Délai de ${user.gender === "female" ? "3" : "2"} mois non respecté`
                        }
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Info Section */}
        <View className="bg-tertiary-container/10 rounded-2xl p-4 border border-tertiary/20 mt-4">
          <View className="flex-row items-center gap-2 mb-2">
            <MaterialIcons name="info" size={16} color="#006847" />
            <Text className="text-sm font-semibold text-tertiary">
              Critères d'éligibilité
            </Text>
          </View>
          <Text className="text-xs text-on-surface-variant leading-relaxed">
            Pour être éligible au don, vous devez avoir un groupe sanguin compatible 
            et respecter le délai d'attente : 2 mois pour les hommes, 3 mois pour les femmes 
            après votre dernier don.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
