import { View, Text } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface Props {
  role: "user" | "assistant";
  content: string;
}

export default function ChatMessageBubble({ role, content }: Props) {
  const isUser = role === "user";

  return (
    <View
      className={`flex-row mb-3 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <View className="w-8 h-8 rounded-full bg-primary items-center justify-center mr-2 mt-1">
          <MaterialIcons name="smart-toy" size={18} color="white" />
        </View>
      )}

      <View
        className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${
          isUser
            ? "bg-primary rounded-br-md"
            : "bg-surface-container-high rounded-bl-md"
        }`}
      >
        <Text
          className={`text-sm leading-5 ${
            isUser ? "text-white" : "text-on-surface"
          }`}
        >
          {content}
        </Text>
      </View>
    </View>
  );
}
