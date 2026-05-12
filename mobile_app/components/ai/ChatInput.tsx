import { View, TextInput, Pressable, ActivityIndicator } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export default function ChatInput({ value, onChangeText, onSubmit, isLoading }: Props) {
  return (
    <View className="flex-row items-end px-3 py-2 bg-surface border-t border-outline-variant">
      <TextInput
        className="flex-1 min-h-[40px] max-h-[100px] px-4 py-2.5 bg-surface-container-lowest rounded-2xl text-sm text-on-surface"
        placeholder="Posez votre question à SangBot..."
        placeholderTextColor="#906f70"
        value={value}
        onChangeText={onChangeText}
        multiline
        textAlignVertical="center"
        returnKeyType="send"
        blurOnSubmit={false}
        onSubmitEditing={onSubmit}
        editable={!isLoading}
      />
      <Pressable
        onPress={onSubmit}
        disabled={isLoading || !value.trim()}
        className={`ml-2 w-10 h-10 rounded-full items-center justify-center ${
          isLoading || !value.trim()
            ? "bg-surface-container-high"
            : "bg-primary"
        }`}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#906f70" />
        ) : (
          <MaterialIcons
            name="send"
            size={20}
            color={value.trim() ? "white" : "#906f70"}
          />
        )}
      </Pressable>
    </View>
  );
}
