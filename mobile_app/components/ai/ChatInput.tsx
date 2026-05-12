import { View, TextInput, Pressable, ActivityIndicator } from "react-native";
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

  return (
    <View className="flex-row items-end px-3 py-2 bg-white border-t border-gray-100">
      <TextInput
        className="flex-1 min-h-[38px] max-h-[90px] px-3.5 py-2 bg-gray-50 rounded-2xl text-[13px] text-gray-800"
        placeholder="Votre question..."
        placeholderTextColor="#aaa"
        value={value}
        onChangeText={onChangeText}
        multiline
        textAlignVertical="center"
        returnKeyType="send"
        blurOnSubmit={false}
        onSubmitEditing={onSubmit}
        editable={!isLoading}
      />
      {isLoading ? (
        <Pressable
          onPress={onStop}
          className="ml-2 w-9 h-9 rounded-full bg-gray-200 items-center justify-center"
        >
          <MaterialIcons name="stop" size={18} color="#666" />
        </Pressable>
      ) : (
        <Pressable
          onPress={onSubmit}
          disabled={!canSend}
          className={`ml-2 w-9 h-9 rounded-full items-center justify-center ${
            canSend ? "bg-[#b80035]" : "bg-gray-100"
          }`}
        >
          <MaterialIcons
            name="send"
            size={18}
            color={canSend ? "white" : "#ccc"}
          />
        </Pressable>
      )}
    </View>
  );
}
