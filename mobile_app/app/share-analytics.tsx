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
import { getShareAnalytics, type ShareAnalytics } from "@/services/alert-sharing";
import Toast, { type ToastType } from "@/components/ui/Toast";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getActivityIcon(type: ShareAnalytics["recentActivity"][0]["type"]) {
  switch (type) {
    case "share":
      return "share";
    case "click":
      return "touch-app";
    case "conversion":
      return "check-circle";
    default:
      return "info";
  }
}

function getActivityColor(type: ShareAnalytics["recentActivity"][0]["type"]) {
  switch (type) {
    case "share":
      return "#006591";
    case "click":
      return "#f59e0b";
    case "conversion":
      return "#006847";
    default:
      return "#906f70";
  }
}

export default function ShareAnalyticsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<ShareAnalytics | null>(null);
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

  const loadAnalytics = async (isRefreshing = false) => {
    if (!user?.id) {
      showToast("Vous devez être connecté pour voir les analytics", "error");
      return;
    }

    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await getShareAnalytics(user.id);
      setAnalytics(data);
    } catch (error) {
      showToast("Impossible de charger les analytics", "error");
    } finally {
      if (isRefreshing) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadAnalytics();
  }, [user?.id]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-surface">
        <View className="flex-1 items-center justify-center px-8">
          <MaterialIcons name="analytics" size={48} color="#906f70" />
          <Text className="text-lg font-bold text-on-surface mt-4 mb-2">
            Chargement des analytics...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!analytics) {
    return (
      <SafeAreaView className="flex-1 bg-surface">
        <View className="flex-1 items-center justify-center px-8">
          <MaterialIcons name="error-outline" size={48} color="#ba1a1a" />
          <Text className="text-lg font-bold text-on-surface mt-4 mb-2">
            Erreur de chargement
          </Text>
          <Text className="text-sm text-on-surface-variant text-center mb-4">
            Impossible de charger les données d'analytics
          </Text>
          <Pressable
            onPress={() => void loadAnalytics()}
            className="bg-primary px-6 py-3 rounded-xl"
          >
            <Text className="text-white font-semibold">Réessayer</Text>
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
          <Text className="text-lg font-bold text-on-surface">Impact de vos partages</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void loadAnalytics(true)} />
        }
      >
        {/* Main Stats */}
        <View className="bg-surface-container-lowest rounded-2xl p-5 mb-4 shadow-sm border border-black/5">
          <Text className="text-sm font-bold text-on-surface mb-4">
            Vue d'ensemble
          </Text>
          
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1 bg-surface-container-highest p-3 rounded-xl">
              <Text className="text-[10px] text-on-surface-variant uppercase font-bold mb-1">
                Partages
              </Text>
              <Text className="text-2xl font-extrabold text-primary">{analytics.totalShares}</Text>
            </View>
            <View className="flex-1 bg-surface-container-highest p-3 rounded-xl">
              <Text className="text-[10px] text-on-surface-variant uppercase font-bold mb-1">
                Clics
              </Text>
              <Text className="text-2xl font-extrabold text-secondary">{analytics.totalClicks}</Text>
            </View>
            <View className="flex-1 bg-surface-container-highest p-3 rounded-xl">
              <Text className="text-[10px] text-on-surface-variant uppercase font-bold mb-1">
                Conversions
              </Text>
              <Text className="text-2xl font-extrabold text-tertiary">{analytics.totalConversions}</Text>
            </View>
          </View>

          <View className="bg-tertiary-container/10 p-3 rounded-xl">
            <View className="flex-row items-center gap-2 mb-1">
              <MaterialIcons name="trending-up" size={16} color="#006847" />
              <Text className="text-sm font-semibold text-tertiary">
                Taux de conversion
              </Text>
            </View>
            <Text className="text-xl font-extrabold text-tertiary">
              {analytics.conversionRate.toFixed(1)}%
            </Text>
            <Text className="text-xs text-on-surface-variant">
              {analytics.totalClicks > 0 
                ? `${analytics.totalConversions} dons sur ${analytics.totalClicks} clics`
                : "Pas encore de clics"
              }
            </Text>
          </View>
        </View>

        {/* Top Platforms */}
        {analytics.topPlatforms.length > 0 && (
          <View className="bg-surface-container-lowest rounded-2xl p-5 mb-4 border border-black/5">
            <Text className="text-sm font-bold text-on-surface mb-3">
              Plateformes les plus utilisées
            </Text>
            
            <View className="space-y-2">
              {analytics.topPlatforms.map((platform, index) => (
                <View key={platform.platform} className="flex-row items-center gap-3">
                  <View className="w-8 h-8 bg-surface-container-highest rounded-full items-center justify-center">
                    <Text className="text-xs font-bold text-on-surface">{index + 1}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-on-surface capitalize">
                      {platform.platform}
                    </Text>
                  </View>
                  <View className="bg-primary/10 px-2 py-1 rounded-full">
                    <Text className="text-xs font-bold text-primary">{platform.count}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Recent Activity */}
        {analytics.recentActivity.length > 0 && (
          <View className="bg-surface-container-lowest rounded-2xl p-5 mb-4 border border-black/5">
            <Text className="text-sm font-bold text-on-surface mb-3">
              Activité récente
            </Text>
            
            <View className="space-y-2">
              {analytics.recentActivity.map((activity, index) => (
                <View key={index} className="flex-row items-center gap-3 p-3 bg-surface-container-highest rounded-xl">
                  <View 
                    className="w-8 h-8 rounded-full items-center justify-center"
                    style={{ backgroundColor: `${getActivityColor(activity.type)}20` }}
                  >
                    <MaterialIcons 
                      name={getActivityIcon(activity.type)} 
                      size={16} 
                      color={getActivityColor(activity.type)} 
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-on-surface">
                      {activity.type === "share" && "Nouveau partage"}
                      {activity.type === "click" && "Clic sur le lien"}
                      {activity.type === "conversion" && "Don réservé"}
                    </Text>
                    <Text className="text-xs text-on-surface-variant">
                      {formatDate(activity.timestamp)}
                      {activity.platform && ` via ${activity.platform}`}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Impact Message */}
        <View className="bg-primary p-5 rounded-2xl shadow-lg shadow-primary/20">
          <View className="flex-row items-center gap-3 mb-3">
            <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center">
              <MaterialIcons name="favorite" size={24} color="#ffffff" />
            </View>
            <View className="flex-1">
              <Text className="text-white text-lg font-extrabold">
                Votre impact compte
              </Text>
              <Text className="text-white/80 text-sm">
                Chaque partage peut sauver des vies
              </Text>
            </View>
          </View>
          
          <Text className="text-white/90 text-sm leading-relaxed">
            Grâce à vos {analytics.totalShares} partages, {analytics.totalClicks} personnes ont consulté l'alerte et {analytics.totalConversions} dons ont été réservés. Continuez à partager pour augmenter cet impact !
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
