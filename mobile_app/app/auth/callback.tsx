import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import * as Linking from "expo-linking";
import { supabase } from "@/services/supabase";

export default function AuthCallback() {
  const url = Linking.useURL();

  const parseAuthUrl = (urlStr: string) => {
    const params: { [key: string]: string } = {};
    const queryMatch = urlStr.match(/\?([^#]+)/);
    if (queryMatch) {
      queryMatch[1].split("&").forEach((param) => {
        const [key, val] = param.split("=");
        if (key && val) params[key] = decodeURIComponent(val);
      });
    }
    const hashMatch = urlStr.match(/#(.+)/);
    if (hashMatch) {
      hashMatch[1].split("&").forEach((param) => {
        const [key, val] = param.split("=");
        if (key && val) params[key] = decodeURIComponent(val);
      });
    }
    return params;
  };

  useEffect(() => {
    async function handleCallback() {
      try {
        // 1. Vérifier d'abord si une session active existe déjà
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.replace("/(tabs)");
          return;
        }

        // 2. Si pas de session, analyser l'URL pour extraire le code ou le token
        if (url) {
          const params = parseAuthUrl(url);
          const { code, access_token, refresh_token } = params;

          if (code) {
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) {
              console.error("Erreur lors de l'échange du code OAuth :", error.message);
              router.replace("/(auth)/login");
              return;
            }
            router.replace("/(tabs)");
            return;
          }

          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            if (error) {
              console.error("Erreur lors de l'établissement de la session :", error.message);
              router.replace("/(auth)/login");
              return;
            }
            router.replace("/(tabs)");
            return;
          }
        }

        // 3. Si aucun paramètre n'a pu être exploité et pas de session
        // On attend un peu au cas où la session est en cours d'établissement par WebBrowser
        const checkSessionTimer = setTimeout(async () => {
          const { data: { session: finalSession } } = await supabase.auth.getSession();
          if (finalSession) {
            router.replace("/(tabs)");
          } else {
            router.replace("/(auth)/login");
          }
        }, 1500);

        return () => clearTimeout(checkSessionTimer);
      } catch (err) {
        console.error("Erreur dans le callback d'authentification :", err);
        router.replace("/(auth)/login");
      }
    }

    handleCallback();
  }, [url]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff7f8" }}>
      <ActivityIndicator size="large" color="#b80035" />
    </View>
  );
}
