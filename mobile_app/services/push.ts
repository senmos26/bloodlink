// Web-safe stub — push notifications are native-only
// expo-notifications requires a development build and does not work on web

export async function requestNotificationPermission(): Promise<boolean> {
  return false;
}

export async function getPushToken(): Promise<null> {
  return null;
}

export async function registerPushToken(_userId: string): Promise<boolean> {
  return false;
}

export function onForegroundNotification(
  _callback: (notification: any) => void,
) {
  return { remove() {} };
}

export function onNotificationResponse(
  _callback: (response: any) => void,
) {
  return { remove() {} };
}

export async function initializeNotifications(): Promise<void> {}

export async function getLastNotificationResponse(): Promise<any> {
  return null;
}
