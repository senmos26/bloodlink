import { useEffect, useState } from "react";
import "react-native-gesture-handler";
import { Stack, router, useSegments } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Linking from "expo-linking";
import * as SplashScreen from "expo-splash-screen";
import PremiumLaunchScreen from "@/components/ui/PremiumLaunchScreen";
import { supabase } from "@/services/supabase";
import { registerPushToken, onNotificationResponse } from "@/services/push";
import "./global.css";

SplashScreen.preventAutoHideAsync().catch(() => {});

function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [launchReady, setLaunchReady] = useState(false);
  const segments = useSegments();

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});

    const launchTimer = setTimeout(() => {
      setLaunchReady(true);
    }, 1700);

    // Handle deep links for email confirmation
    const handleDeepLink = (event: { url: string }) => {
      const url = event.url;
      if (url.includes("access_token") || url.includes("refresh_token")) {
        // Supabase auth redirect with tokens
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) {
            router.replace("/(tabs)");
          }
        });
      }
    };

    const subscription = Linking.addEventListener("url", handleDeepLink);

    supabase.auth.getSession().then(({ data: { session } }) => {
      const isAuthGroup = segments[0] === "(auth)";
      if (!session && !isAuthGroup) {
        router.replace("/(auth)/welcome");
      }
      setLoading(false);
    });

    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const isAuthGroup = segments[0] === "(auth)";
      if (!session && !isAuthGroup) {
        router.replace("/(auth)/welcome");
      }

      // Register push token on sign-in
      if (session?.user) {
        registerPushToken(session.user.id).catch(() => {});
      }
    });

    // Listen for notification taps
    const responseListener = onNotificationResponse((response) => {
      const data = response.notification.request.content.data;
      if (data?.type === "appointment") {
        router.push("/appointments" as any);
      } else if (data?.type === "alert") {
        router.push("/map");
      }
    });

    return () => {
      clearTimeout(launchTimer);
      subscription.remove();
      authSubscription.unsubscribe();
      responseListener.remove();
    };
  }, [segments]);

  if (loading || !launchReady) {
    return <PremiumLaunchScreen />;
  }

  return children;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthGuard>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="booking" options={{ presentation: "modal", headerShown: false }} />
            <Stack.Screen name="notifications" options={{ presentation: "modal", headerShown: false }} />
          </Stack>
        </AuthGuard>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
