import { View, TextInput, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  isStreaming?: boolean;
  onStop?: () => void;
}

export default function ChatInput({ value, onChangeText, onSubmit, isLoading, isStreaming, onStop }: Props) {
  const canSend = value.trim().length > 0 && !isLoading;
  const showStop = isLoading || isStreaming;

  return (
    <View className="px-4 py-3 bg-white border-t border-gray-100">
      <View className="flex-row items-end bg-gray-50 rounded-2xl border border-gray-200 px-3 py-1">
        <TextInput
          className="flex-1 min-h-[40px] max-h-[100px] px-1 py-2 text-[14px] leading-[20px] text-gray-800"
          placeholder="Envoyer un message..."
          placeholderTextColor="#9ca3af"
          value={value}
          onChangeText={onChangeText}
          multiline
          textAlignVertical="center"
          returnKeyType="send"
          blurOnSubmit={false}
          onSubmitEditing={onSubmit}
          editable={!isLoading}
        />
        {showStop ? (
          <Pressable
            onPress={onStop}
            className="w-8 h-8 rounded-full bg-gray-800 items-center justify-center mb-1"
          >
            <View className="w-3 h-3 rounded-[1px] bg-white" />
          </Pressable>
        ) : (
          <Pressable
            onPress={onSubmit}
            disabled={!canSend}
            className={`w-8 h-8 rounded-full items-center justify-center mb-1 ${
              canSend ? "bg-[#b80035]" : "bg-transparent"
            }`}
          >
            <MaterialIcons
              name="arrow-upward"
              size={18}
              color={canSend ? "white" : "#ccc"}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}
