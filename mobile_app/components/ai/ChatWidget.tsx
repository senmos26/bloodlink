import { useState, useEffect } from "react";
import { Pressable, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/services/supabase";
import ChatDrawer from "./ChatDrawer";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const [accessToken, setAccessToken] = useState<string | undefined>();

  useEffect(() => {
    if (user) {
      supabase.auth.getSession().then(({ data }: { data: { session: { access_token: string } | null } }) => {
        setAccessToken(data.session?.access_token ?? undefined);
      });
    }
  }, [user]);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        className="absolute bottom-20 right-5 w-14 h-14 rounded-full bg-[#b80035] items-center justify-center shadow-lg shadow-black/20 active:scale-95 z-50"
        style={{
          elevation: 6,
        }}
      >
        <MaterialIcons name="chat" size={24} color="white" />
      </Pressable>

      <ChatDrawer
        visible={open}
        onClose={() => setOpen(false)}
        userId={user?.id}
        accessToken={accessToken}
      />
    </>
  );
}
