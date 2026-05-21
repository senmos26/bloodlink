import * as RN from "react-native";
import React, { useEffect, useState } from "react";
import "react-native-gesture-handler";
import { Stack, router, useSegments } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Linking from "expo-linking";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import PremiumLaunchScreen from "@/components/ui/PremiumLaunchScreen";
import { supabase } from "@/services/supabase";
import { registerPushToken, onNotificationResponse } from "@/services/push";
import "./global.css";

// Global fonts loaded state
let globalFontsLoaded = false;

// Custom font family mapping based on font weight
const getOutfitFont = (style: any) => {
  if (!globalFontsLoaded) return undefined;
  if (!style) return "Outfit-Regular";
  const flattened = RN.StyleSheet.flatten(style);
  if (!flattened) return "Outfit-Regular";

  // If a custom font family is already defined, keep it
  const existingFont = flattened.fontFamily;
  if (
    existingFont &&
    existingFont !== "System" &&
    existingFont !== "sans-serif" &&
    existingFont !== "sans-serif-medium" &&
    existingFont !== "sans-serif-light" &&
    existingFont !== "sans-serif-thin" &&
    existingFont !== "sans-serif-condensed"
  ) {
    return existingFont;
  }

  const weightStr = flattened.fontWeight ? String(flattened.fontWeight) : "";
  if (weightStr === "bold" || weightStr === "700" || weightStr === "800" || weightStr === "900") {
    return "Outfit-Bold";
  }
  if (weightStr === "600" || weightStr === "semibold") {
    return "Outfit-SemiBold";
  }
  if (weightStr === "500" || weightStr === "medium") {
    return "Outfit-Medium";
  }
  return "Outfit-Regular";
};

// Patch RN.Text
const OriginalText = RN.Text;
const PatchedText = React.forwardRef((props: any, ref: any) => {
  if (!globalFontsLoaded) {
    return <OriginalText ref={ref} {...props} />;
  }

  const font = getOutfitFont(props.style);
  if (!font) {
    return <OriginalText ref={ref} {...props} />;
  }

  const flattened = RN.StyleSheet.flatten(props.style) || {};
  const hasCustomFont =
    flattened.fontFamily &&
    flattened.fontFamily !== "System" &&
    flattened.fontFamily !== "sans-serif" &&
    flattened.fontFamily !== "sans-serif-medium" &&
    flattened.fontFamily !== "sans-serif-light" &&
    flattened.fontFamily !== "sans-serif-thin" &&
    flattened.fontFamily !== "sans-serif-condensed";

  const styleOverride: any = {};
  if (!hasCustomFont) {
    styleOverride.fontFamily = font;
    if (flattened.fontWeight) {
      styleOverride.fontWeight = "normal";
    }
  }

  return (
    <OriginalText
      ref={ref}
      {...props}
      style={[
        { fontFamily: "Outfit-Regular" },
        props.style,
        styleOverride,
      ]}
    />
  );
});
(PatchedText as any).displayName = "Text";
try {
  Object.defineProperty(RN, "Text", {
    get: () => PatchedText,
    configurable: true,
    enumerable: true,
  });
} catch (e) {
  console.error("Failed to patch RN.Text with defineProperty:", e);
}

// Patch RN.TextInput
const OriginalTextInput = RN.TextInput;
const PatchedTextInput = React.forwardRef((props: any, ref: any) => {
  if (!globalFontsLoaded) {
    return <OriginalTextInput ref={ref} {...props} />;
  }

  const font = getOutfitFont(props.style);
  if (!font) {
    return <OriginalTextInput ref={ref} {...props} />;
  }

  const flattened = RN.StyleSheet.flatten(props.style) || {};
  const hasCustomFont =
    flattened.fontFamily &&
    flattened.fontFamily !== "System" &&
    flattened.fontFamily !== "sans-serif" &&
    flattened.fontFamily !== "sans-serif-medium" &&
    flattened.fontFamily !== "sans-serif-light" &&
    flattened.fontFamily !== "sans-serif-thin" &&
    flattened.fontFamily !== "sans-serif-condensed";

  const styleOverride: any = {};
  if (!hasCustomFont) {
    styleOverride.fontFamily = font;
    if (flattened.fontWeight) {
      styleOverride.fontWeight = "normal";
    }
  }

  return (
    <OriginalTextInput
      ref={ref}
      {...props}
      style={[
        { fontFamily: "Outfit-Regular" },
        props.style,
        styleOverride,
      ]}
    />
  );
});
(PatchedTextInput as any).displayName = "TextInput";
try {
  Object.defineProperty(RN, "TextInput", {
    get: () => PatchedTextInput,
    configurable: true,
    enumerable: true,
  });
} catch (e) {
  console.error("Failed to patch RN.TextInput with defineProperty:", e);
}

SplashScreen.preventAutoHideAsync().catch(() => {});

function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [launchReady, setLaunchReady] = useState(false);
  const segments = useSegments();

  const [fontsLoaded, fontError] = useFonts({
    "Outfit-Regular": require("../assets/fonts/Outfit-Regular.ttf"),
    "Outfit-Medium": require("../assets/fonts/Outfit-Medium.ttf"),
    "Outfit-SemiBold": require("../assets/fonts/Outfit-SemiBold.ttf"),
    "Outfit-Bold": require("../assets/fonts/Outfit-Bold.ttf"),
    "SpaceMono": require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (fontError) {
      console.error("Erreur de chargement des polices :", fontError);
    }
  }, [fontError]);

  useEffect(() => {
    if (fontsLoaded) {
      globalFontsLoaded = true;
    }
  }, [fontsLoaded]);

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
      const isAuthRoute = segments[0] === "(auth)" || (segments[0] === "auth" && segments[1] === "callback");
      if (session && isAuthRoute) {
        router.replace("/(tabs)");
      } else if (!session && !isAuthRoute) {
        router.replace("/(auth)/welcome");
      }
      setLoading(false);
    });

    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const isAuthRoute = segments[0] === "(auth)" || (segments[0] === "auth" && segments[1] === "callback");
      if (session && isAuthRoute) {
        router.replace("/(tabs)");
      } else if (!session && !isAuthRoute) {
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

  if (loading || !launchReady || !fontsLoaded) {
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
            <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
            <Stack.Screen name="booking" options={{ presentation: "modal", headerShown: false }} />
            <Stack.Screen name="notifications" options={{ presentation: "modal", headerShown: false }} />
          </Stack>
        </AuthGuard>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
