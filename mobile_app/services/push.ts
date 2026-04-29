import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { supabase } from "@/services/supabase";

// ── Configuration ──────────────────────────────────────────────────────
// Comportement des notifications quand l'app est au premier plan
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ── Types ──────────────────────────────────────────────────────────────
export interface PushToken {
  token: string;
  deviceId: string | null;
  platform: "ios" | "android" | "web";
}

// ── API ────────────────────────────────────────────────────────────────

/** Demander la permission de recevoir des notifications */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) {
    console.warn("[push] Les notifications push nécessitent un appareil physique.");
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("[push] Permission de notification refusée.");
    return false;
  }

  return true;
}

/** Obtenir le token Expo Push (ou FCM/APNS en production) */
export async function getPushToken(): Promise<PushToken | null> {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return null;

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: "bloodlink-mobile", // à adapter selon le projet EAS
    });

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#b80035",
      });
    }

    return {
      token: tokenData.data,
      deviceId: Device.modelName ?? null,
      platform: Platform.OS as "ios" | "android" | "web",
    };
  } catch (err) {
    console.error("[push] Erreur obtention token:", err);
    return null;
  }
}

/** Enregistrer le token dans le profil Supabase */
export async function registerPushToken(userId: string): Promise<boolean> {
  const pushToken = await getPushToken();
  if (!pushToken) return false;

  const { error } = await supabase
    .from("profiles")
    .update({
      fcm_token: pushToken.token,
      device_platform: pushToken.platform,
    })
    .eq("id", userId);

  if (error) {
    console.error("[push] Erreur enregistrement token:", error);
    return false;
  }

  console.log("[push] Token enregistré pour", userId);
  return true;
}

// ── Listeners ──────────────────────────────────────────────────────────

/** Écouter les notifications reçues au premier plan */
export function onForegroundNotification(
  callback: (notification: Notifications.Notification) => void,
) {
  return Notifications.addNotificationReceivedListener(callback);
}

/** Écouter les taps sur les notifications */
export function onNotificationResponse(
  callback: (response: Notifications.NotificationResponse) => void,
) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}
