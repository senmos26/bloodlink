import { View, Text } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface Props {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export default function ChatMessageBubble({ role, content, isStreaming }: Props) {
  const isUser = role === "user";

  return (
    <View className={`flex-row mb-2.5 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <View className="w-7 h-7 rounded-full bg-[#b80035] items-center justify-center mr-2 mt-0.5">
          <MaterialIcons name="favorite" size={14} color="white" />
        </View>
      )}

      <View
        className={`max-w-[82%] px-3.5 py-2 rounded-2xl ${
          isUser
            ? "bg-[#b80035] rounded-br-sm"
            : "bg-gray-100 rounded-bl-sm"
        }`}
      >
        <Text
          className={`text-[13px] leading-[18px] ${
            isUser ? "text-white" : "text-gray-800"
          }`}
        >
          {content}
          {isStreaming && !content && (
            <Text className="text-gray-400">●●●</Text>
          )}
          {isStreaming && content && (
            <Text className="text-gray-400">▎</Text>
          )}
        </Text>
      </View>
    </View>
  );
}
