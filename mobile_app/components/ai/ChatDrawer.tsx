import { useCallback, useRef } from "react";
import {
  View,
  Text,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
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
}

const SUGGESTED_QUESTIONS = [
  "Suis-je éligible pour donner ?",
  "Quand puis-je donner à nouveau ?",
  "Quels sont les effets secondaires ?",
  "Où trouver un centre près de moi ?",
];

export default function ChatDrawer({ visible, onClose, userId }: Props) {
  const { messages, input, setInput, isLoading, error, handleSubmit, clear } =
    useChat({ userId });

  const flatListRef = useRef<FlatList>(null);

  const scrollToEnd = useCallback(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="overFullScreen"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-surface">
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 border-b border-outline-variant bg-surface">
          <View className="w-9 h-9 rounded-full bg-primary items-center justify-center mr-3">
            <MaterialIcons name="smart-toy" size={20} color="white" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-on-surface">
              SangBot
            </Text>
            <Text className="text-xs text-on-surface-variant">
              Assistant BloodLink
            </Text>
          </View>
          <Pressable
            onPress={() => {
              clear();
              onClose();
            }}
            className="p-2 rounded-full active:bg-surface-container-high"
          >
            <MaterialIcons name="close" size={24} color="#5c3f40" />
          </Pressable>
        </View>

        {/* Messages */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1"
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ChatMessageBubble role={item.role} content={item.content} />
            )}
            contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
            onContentSizeChange={scrollToEnd}
            onLayout={scrollToEnd}
            ListEmptyComponent={() => (
              <View className="items-center justify-center py-12 px-6">
                <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-4">
                  <MaterialIcons
                    name="volunteer-activism"
                    size={32}
                    color="#b80035"
                  />
                </View>
                <Text className="text-base font-bold text-on-surface text-center mb-2">
                  Bienvenue sur SangBot
                </Text>
                <Text className="text-sm text-on-surface-variant text-center mb-6">
                  Votre assistant intelligent pour le don de sang. Posez vos
                  questions sur l'éligibilité, les centres, les rendez-vous...
                </Text>

                <View className="w-full gap-2">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <Pressable
                      key={q}
                      onPress={() => {
                        setInput(q);
                        handleSubmit();
                      }}
                      className="px-4 py-3 bg-surface-container-lowest rounded-xl border border-outline-variant active:bg-surface-container-high"
                    >
                      <Text className="text-sm text-primary font-medium">
                        {q}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
            ListFooterComponent={() =>
              isLoading && messages.length > 0 ? (
                <View className="flex-row items-center px-4 py-2">
                  <ActivityIndicator size="small" color="#b80035" />
                  <Text className="ml-2 text-xs text-on-surface-variant">
                    SangBot réfléchit...
                  </Text>
                </View>
              ) : error ? (
                <View className="mx-4 my-2 p-3 bg-error-container rounded-xl">
                  <Text className="text-sm text-error">{error}</Text>
                </View>
              ) : null
            }
          />

          <ChatInput
            value={input}
            onChangeText={setInput}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
