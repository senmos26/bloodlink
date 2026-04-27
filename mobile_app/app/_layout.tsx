import { useEffect, useState } from "react";
import { Stack, router, useSegments } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ActivityIndicator, View } from "react-native";
import * as Linking from "expo-linking";
import { supabase } from "@/services/supabase";
import "./global.css";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const segments = useSegments();

  useEffect(() => {
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
        router.replace("/(auth)/login");
      }
      setLoading(false);
    });

    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const isAuthGroup = segments[0] === "(auth)";
      if (!session && !isAuthGroup) {
        router.replace("/(auth)/login");
      }
    });

    return () => {
      subscription.remove();
      authSubscription.unsubscribe();
    };
  }, [segments]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" color="#b80035" />
      </View>
    );
  }

  return children;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthGuard>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" />
        </Stack>
      </AuthGuard>
    </SafeAreaProvider>
  );
}
