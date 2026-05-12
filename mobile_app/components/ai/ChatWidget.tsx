import { useState } from "react";
import { Pressable, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";
import ChatDrawer from "./ChatDrawer";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        className="absolute bottom-20 right-5 w-14 h-14 rounded-full bg-primary items-center justify-center shadow-lg shadow-black/20 active:scale-95 z-50"
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
      />
    </>
  );
}
