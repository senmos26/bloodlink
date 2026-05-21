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
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  timeAgo,
  getNotificationIcon,
  sendTestPush,
  type AppNotification,
  type NotificationType,
} from "@/services/notifications";

// ── Group labels ───────────────────────────────────────────────────────
const GROUP_LABELS: Record<string, string> = {
  alert: "Alertes urgentes",
  appointment: "Rendez-vous",
  donation: "Dons",
  system: "Système",
};

const GROUP_ORDER: NotificationType[] = ["alert", "appointment", "donation", "system"];

// ── Component ──────────────────────────────────────────────────────────
export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sendingPush, setSendingPush] = useState(false);

  const load = useCallback(async (showRefresh = false) => {
    if (!user?.id) return;
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [notifs, count] = await Promise.all([
        getUserNotifications(user.id),
        getUnreadCount(user.id),
      ]);
      setNotifications(notifs);
      setUnreadCount(count);
    } catch (err) {
      console.error("Erreur chargement notifications:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleMarkAllRead = async () => {
    if (!user?.id) return;
    try {
      await markAllAsRead(user.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // silent
    }
  };

  const handleSendTestPush = async () => {
    if (!user?.id || sendingPush) return;

    setSendingPush(true);
    try {
      const result = await sendTestPush({
        title: "Test push BloodLink",
        body: "Si tu vois ceci, la vraie push distante fonctionne.",
        type: "system",
      });

      if (!result.success) {
        Alert.alert(
          "Push non envoyée",
          result.hint ?? result.error ?? "Impossible d'envoyer la push de test.",
        );
        return;
      }

      Alert.alert("Push envoyée", "Vérifie la notification système sur ton appareil.");
      await load(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      Alert.alert("Erreur push", message);
    } finally {
      setSendingPush(false);
    }
  };

  const handleTap = async (notif: AppNotification) => {
    if (!notif.isRead) {
      try {
        await markAsRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)),
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // silent
      }
    }

    // Navigation selon le type
    if (notif.type === "appointment") {
      router.push("/(tabs)/appointments" as any);
    } else if (notif.type === "alert") {
      router.push("/(tabs)/map" as any);
    }
  };

  // Grouper par type
  const grouped = new Map<NotificationType, AppNotification[]>();
  for (const n of notifications) {
    const list = grouped.get(n.type) ?? [];
    list.push(n);
    grouped.set(n.type, list);
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-black/5">
        <View className="flex-row items-center gap-3">
          <Pressable onPress={() => router.back()} className="p-1">
            <MaterialIcons name="arrow-back" size={24} color="#0d1c2e" />
          </Pressable>
          <View>
            <Text className="text-lg font-bold text-on-surface">Notifications</Text>
            {unreadCount > 0 && (
              <Text className="text-xs text-primary font-semibold">
                {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
              </Text>
            )}
          </View>
        </View>
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={handleSendTestPush}
            className={`px-3 py-1.5 rounded-full ${sendingPush ? "bg-secondary/10" : "bg-secondary/15"}`}
            disabled={sendingPush}
          >
            <Text className="text-xs font-bold text-secondary">
              {sendingPush ? "Envoi..." : "Test push"}
            </Text>
          </Pressable>
          {unreadCount > 0 && (
            <Pressable onPress={handleMarkAllRead} className="px-3 py-1.5 rounded-full bg-primary/10">
              <Text className="text-xs font-bold text-primary">Tout lire</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#b80035" />
        </View>
      ) : notifications.length === 0 ? (
        <EmptyNotifications />
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={["#b80035"]} />}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {GROUP_ORDER.map((type) => {
            const items = grouped.get(type);
            if (!items || items.length === 0) return null;
            return (
              <View key={type} className="mb-2">
                {/* Section header */}
                <View className="flex-row items-center justify-between px-6 py-2 bg-surface-container-low">
                  <Text className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    {GROUP_LABELS[type] ?? type}
                  </Text>
                  <Text className="text-[10px] text-on-surface-variant">{items.length}</Text>
                </View>

                {/* Items */}
                {items.map((notif) => (
                  <NotificationItem
                    key={notif.id}
                    notification={notif}
                    onTap={handleTap}
                  />
                ))}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ── Notification Item ──────────────────────────────────────────────────

function NotificationItem({
  notification,
  onTap,
}: {
  notification: AppNotification;
  onTap: (n: AppNotification) => void;
}) {
  const iconConfig = getNotificationIcon(notification.type);

  return (
    <Pressable
      className={`flex-row items-start gap-3 px-6 py-3.5 active:bg-surface-container-low ${!notification.isRead ? "bg-primary/[0.03]" : ""}`}
      onPress={() => onTap(notification)}
    >
      {/* Icon */}
      <View className="w-9 h-9 rounded-xl items-center justify-center mt-0.5" style={{ backgroundColor: iconConfig.bgColor }}>
        <MaterialIcons
          name={iconConfig.name as React.ComponentProps<typeof MaterialIcons>["name"]}
          size={18}
          color={iconConfig.color}
        />
      </View>

      {/* Content */}
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text className={`text-sm flex-1 ${!notification.isRead ? "font-bold text-on-surface" : "font-medium text-on-surface"}`} numberOfLines={1}>
            {notification.title}
          </Text>
          {/* Unread dot */}
          {!notification.isRead && (
            <View className="w-2 h-2 rounded-full bg-primary" />
          )}
        </View>
        <Text className="text-xs text-on-surface-variant mt-0.5" numberOfLines={2}>
          {notification.body}
        </Text>
        <Text className="text-[10px] text-on-surface-variant/60 mt-1">
          {timeAgo(notification.createdAt)}
        </Text>
      </View>
    </Pressable>
  );
}

// ── Empty State ────────────────────────────────────────────────────────

function EmptyNotifications() {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <View className="w-20 h-20 bg-surface-container-low rounded-3xl items-center justify-center mb-4">
        <MaterialIcons name="notifications-off" size={36} color="#5c3f40" />
      </View>
      <Text className="text-lg font-bold text-on-surface text-center mb-1">
        Aucune notification
      </Text>
      <Text className="text-sm text-on-surface-variant text-center max-w-[260px]">
        Vos alertes, rappels de rendez-vous et mises à jour apparaîtront ici.
      </Text>
    </View>
  );
}
