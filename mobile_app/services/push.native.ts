import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { supabase } from "@/services/supabase";

// ── Configuration ──────────────────────────────────────────────────────
let notificationsModulePromise: Promise<typeof import("expo-notifications")> | null = null;
let notificationHandlerConfigured = false;

function isExpoGo(): boolean {
  const executionEnvironment = (Constants as { executionEnvironment?: string }).executionEnvironment;
  return executionEnvironment === "storeClient";
}

function hasAndroidFirebaseConfig(): boolean {
  const androidConfig = Constants.expoConfig?.android as { googleServicesFile?: string } | undefined;
  return Platform.OS !== "android" || Boolean(androidConfig?.googleServicesFile);
}

async function getNotificationsModule() {
  if (isExpoGo()) {
    return null;
  }

  if (!notificationsModulePromise) {
    notificationsModulePromise = import("expo-notifications");
  }

  const Notifications = await notificationsModulePromise;

  if (!notificationHandlerConfigured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
    notificationHandlerConfigured = true;
  }

  return Notifications;
}

// ── Types ──────────────────────────────────────────────────────────────
export interface PushToken {
  token: string;
  deviceId: string | null;
  platform: "ios" | "android" | "web";
}

// ── API ────────────────────────────────────────────────────────────────

/** Demander la permission de recevoir des notifications */
export async function requestNotificationPermission(): Promise<boolean> {
  if (isExpoGo()) {
    console.info("[push] Push désactivé dans Expo Go. Utilisez un development build.");
    return false;
  }

  if (!Device.isDevice) {
    console.warn("[push] Les notifications push nécessitent un appareil physique.");
    return false;
  }

  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    console.warn("[push] Module de notifications indisponible.");
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
  if (!hasAndroidFirebaseConfig()) {
    console.warn("[push] Push Android désactivé: Firebase/FCM n'est pas configuré pour ce build.");
    return null;
  }

  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return null;

  try {
    const Notifications = await getNotificationsModule();
    if (!Notifications) {
      return null;
    }

    const projectId =
      Constants.easConfig?.projectId ??
      ((Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ?? undefined);

    const tokenData = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();

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
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("Default FirebaseApp is not initialized") || message.includes("FCM")) {
      console.warn("[push] Push Android désactivé: Firebase/FCM n'est pas initialisé pour ce build.");
      return null;
    }
    console.warn("[push] Erreur obtention token:", err);
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
  callback: (notification: unknown) => void,
) {
  let subscription: { remove: () => void } | null = null;

  void getNotificationsModule().then((Notifications) => {
    if (!Notifications) {
      return;
    }
    subscription = Notifications.addNotificationReceivedListener(callback as never);
  });

  return {
    remove() {
      subscription?.remove();
    },
  };
}

/** Écouter les taps sur les notifications */
export function onNotificationResponse(
  callback: (response: unknown) => void,
) {
  let subscription: { remove: () => void } | null = null;

  void getNotificationsModule().then((Notifications) => {
    if (!Notifications) {
      return;
    }
    subscription = Notifications.addNotificationResponseReceivedListener(callback as never);
  });

  return {
    remove() {
      subscription?.remove();
    },
  };
}
