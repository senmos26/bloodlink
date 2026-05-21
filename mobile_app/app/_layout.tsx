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
import { registerPushToken, onNotificationResponse, initializeNotifications, getLastNotificationResponse, showLocalNotification } from "@/services/push";
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
  const [pendingNotification, setPendingNotification] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
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

  // 1. Initialisations uniques au montage de l'application
  useEffect(() => {
    // Initialiser les canaux et les gestionnaires de notifications le plus tôt possible
    initializeNotifications().catch(() => {});

    // Récupérer la notification qui a ouvert l'application (si lancée depuis un état fermé)
    getLastNotificationResponse().then((response) => {
      if (response?.notification) {
        setPendingNotification(response);
      }
    }).catch(() => {});

    SplashScreen.hideAsync().catch(() => {});

    const launchTimer = setTimeout(() => {
      setLaunchReady(true);
    }, 1700);

    // Gérer les liens profonds pour la confirmation d'email
    const handleDeepLink = (event: { url: string }) => {
      const url = event.url;
      if (url.includes("access_token") || url.includes("refresh_token")) {
        supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
          if (currentSession) {
            setSession(currentSession);
            router.replace("/(tabs)");
          }
        });
      }
    };

    const subscription = Linking.addEventListener("url", handleDeepLink);

    // Récupérer la session initiale
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setAuthInitialized(true);
    }).catch(() => {
      setAuthInitialized(true);
    });

    // S'abonner aux changements d'état d'authentification
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setAuthInitialized(true);

      // Enregistrer le jeton push à la connexion
      if (currentSession?.user) {
        registerPushToken(currentSession.user.id).catch(() => {});
      }
    });

    // Écouter les clics sur les notifications (app ouverte ou en arrière-plan)
    const responseListener = onNotificationResponse((response: any) => {
      if (response?.notification) {
        setPendingNotification(response);
      }
    });

    return () => {
      clearTimeout(launchTimer);
      subscription.remove();
      authSubscription.unsubscribe();
      responseListener.remove();
    };
  }, []);

  // 1.5. S'abonner aux notifications en temps réel pour déclencher des notifications locales
  useEffect(() => {
    if (!session?.user?.id) return;

    const userId = session.user.id;
    console.log("[realtime] Initialisation de l'abonnement Realtime pour l'utilisateur:", userId);

    const channel = supabase
      .channel(`user-notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new;
          console.log("[realtime] Nouvelle notification reçue en temps réel:", newNotif);

          // Déclencher une notification locale système sur le téléphone
          showLocalNotification(
            newNotif.title || "BloodLink",
            newNotif.body || "",
            newNotif.data || undefined
          ).catch((e) => console.error("[realtime] Erreur envoi notif locale:", e));
        }
      )
      .subscribe((status, err) => {
        console.log(`[realtime] Canal user-notifications-${userId} - Statut de connexion:`, status);
        if (err) {
          console.warn(`[realtime] Canal user-notifications-${userId} - Erreur de souscription (reconnexion automatique) :`, err);
        }
      });

    return () => {
      console.log("[realtime] Nettoyage du canal user-notifications pour l'utilisateur:", userId);
      supabase.removeChannel(channel).catch(() => {});
    };
  }, [session?.user?.id]);

  // Réactiver la connexion Realtime lorsque l'application revient au premier plan
  useEffect(() => {
    const handleAppStateChange = (nextAppState: RN.AppStateStatus) => {
      if (nextAppState === "active") {
        console.log("[AppState] L'application est revenue au premier plan. Reconnexion Realtime...");
        supabase.realtime.connect();
      }
    };

    const subscription = RN.AppState.addEventListener("change", handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, []);

  // 2. Gardien d'Authentification (AuthGuard) dépendant des changements de session et de segments
  useEffect(() => {
    if (!authInitialized) return;

    const isAuthRoute = segments[0] === "(auth)" || (segments[0] === "auth" && segments[1] === "callback");
    
    if (session && isAuthRoute) {
      router.replace("/(tabs)");
    } else if (!session && !isAuthRoute) {
      router.replace("/(auth)/welcome");
    } else {
      setLoading(false);
    }
  }, [session, authInitialized, segments]);

  // 3. Gérer la redirection des notifications quand l'application est prête
  useEffect(() => {
    if (!loading && launchReady && fontsLoaded && pendingNotification) {
      const data = pendingNotification.notification.request.content.data;
      if (data?.type === "appointment") {
        router.push("/(tabs)/appointments" as any);
      } else if (data?.type === "alert") {
        router.push("/(tabs)/map" as any);
      } else {
        router.push("/notifications" as any);
      }
      setPendingNotification(null);
    }
  }, [loading, launchReady, fontsLoaded, pendingNotification]);

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
