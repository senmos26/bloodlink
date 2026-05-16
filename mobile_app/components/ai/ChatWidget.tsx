import { useState, useEffect } from "react";
import { Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/services/supabase";
import ChatDrawer from "./ChatDrawer";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const { user, loading } = useAuth();
  const [accessToken, setAccessToken] = useState<string | undefined>();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (user) {
      supabase.auth.getSession().then(({ data }: { data: { session: { access_token: string } | null } }) => {
        setAccessToken(data.session?.access_token ?? undefined);
      });

      // Try to use saved profile location (no extra permissions/deps needed)
      (async () => {
        try {
          const { data } = await supabase
            .from("profiles")
            .select("latitude, longitude")
            .eq("id", user.id)
            .single();
          const lat = typeof data?.latitude === "number" ? data.latitude : null;
          const lng = typeof data?.longitude === "number" ? data.longitude : null;
          if (lat !== null && lng !== null) {
            setLocation({ lat, lng });
          }
        } catch {}
      })();
    }
  }, [user]);

  return (
    <>
      <Pressable
        disabled={loading || !user || !accessToken}
        onPress={() => setOpen(true)}
        className="absolute bottom-20 right-5 w-14 h-14 rounded-full bg-[#b80035] items-center justify-center shadow-lg shadow-black/20 active:scale-95 z-50"
        style={{
          elevation: 6,
          opacity: loading || !user || !accessToken ? 0.55 : 1,
        }}
      >
        <MaterialIcons name="chat" size={24} color="white" />
      </Pressable>

      <ChatDrawer
        visible={open}
        onClose={() => setOpen(false)}
        userId={user?.id}
        accessToken={accessToken}
        location={location}
      />
    </>
  );
}
