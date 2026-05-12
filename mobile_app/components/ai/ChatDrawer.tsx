import { useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import ChatMessageBubble from "./ChatMessage";
import ChatInput from "./ChatInput";
import { useChat } from "./useChat";

interface Props {
  visible: boolean;
  onClose: () => void;
  userId?: string;
  accessToken?: string;
}

const SUGGESTIONS = [
  { icon: "check-circle", label: "Éligibilité" },
  { icon: "event", label: "Prochain don" },
  { icon: "local-hospital", label: "Effets secondaires" },
  { icon: "place", label: "Centre proche" },
];

const SUGGESTION_QUERIES: Record<string, string> = {
  "Éligibilité": "Suis-je éligible pour donner du sang ?",
  "Prochain don": "Quand puis-je donner à nouveau ?",
  "Effets secondaires": "Quels sont les effets secondaires du don ?",
  "Centre proche": "Où trouver un centre de transfusion près de chez moi ?",
};

export default function ChatDrawer({ visible, onClose, userId, accessToken }: Props) {
  const { messages, input, setInput, isLoading, isStreaming, error, handleSubmit, stop, clear } =
    useChat({ userId, accessToken });

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [messages]);

  const handleSuggestion = useCallback((label: string) => {
    const query = SUGGESTION_QUERIES[label] ?? label;
    setInput(query);
    setTimeout(() => handleSubmit(), 0);
  }, [setInput, handleSubmit]);

  const showEmpty = messages.length === 0 && !isLoading;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="overFullScreen"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
          <View className="w-8 h-8 rounded-full bg-[#b80035] items-center justify-center mr-3">
            <MaterialIcons name="favorite" size={18} color="white" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-gray-900">
              SangBot
            </Text>
            {isStreaming && (
              <Text className="text-xs text-[#b80035]">En train d'écrire...</Text>
            )}
          </View>
          {isLoading && (
            <Pressable
              onPress={stop}
              className="mr-2 px-3 py-1.5 rounded-full bg-gray-100 active:bg-gray-200"
            >
              <Text className="text-xs font-medium text-gray-600">Arrêter</Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => { clear(); onClose(); }}
            className="p-2 rounded-full active:bg-gray-100"
          >
            <MaterialIcons name="close" size={22} color="#666" />
          </Pressable>
        </View>

        {/* Content */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1"
        >
          {showEmpty ? (
            <View className="flex-1 items-center justify-center px-6">
              <View className="w-14 h-14 rounded-full bg-[#b80035]/10 items-center justify-center mb-3">
                <MaterialIcons name="volunteer-activism" size={28} color="#b80035" />
              </View>
              <Text className="text-lg font-semibold text-gray-900 mb-1">
                Bonjour 👋
              </Text>
              <Text className="text-sm text-gray-500 text-center mb-6">
                Posez vos questions sur le don de sang au Maroc
              </Text>
              <View className="flex-row flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <Pressable
                    key={s.label}
                    onPress={() => handleSuggestion(s.label)}
                    className="flex-row items-center px-3 py-2 bg-gray-50 rounded-full border border-gray-200 active:bg-gray-100"
                  >
                    <MaterialIcons name={s.icon as any} size={14} color="#b80035" />
                    <Text className="ml-1.5 text-xs font-medium text-gray-700">
                      {s.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <ChatMessageBubble
                  role={item.role}
                  content={item.content}
                  isStreaming={isStreaming && item.role === "assistant" && item === messages[messages.length - 1]}
                />
              )}
              contentContainerStyle={{ padding: 12, paddingBottom: 8 }}
              ListFooterComponent={() => {
                if (error) {
                  return (
                    <View className="mx-2 my-2 p-3 bg-red-50 rounded-xl">
                      <Text className="text-sm text-red-600">{error}</Text>
                    </View>
                  );
                }
                if (isLoading && !isStreaming && messages.length > 0) {
                  return (
                    <View className="flex-row items-center px-2 py-2">
                      <ActivityIndicator size="small" color="#b80035" />
                      <Text className="ml-2 text-xs text-gray-400">Réflexion...</Text>
                    </View>
                  );
                }
                return null;
              }}
            />
          )}

          <ChatInput
            value={input}
            onChangeText={setInput}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            isStreaming={isStreaming}
            onStop={stop}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
