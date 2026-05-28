import { useCallback, useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import ChatMessageBubble from "./ChatMessage";
import ChatInput from "./ChatInput";
import { useChat, Conversation } from "./useChat";

interface Props {
  visible: boolean;
  onClose: () => void;
  userId?: string;
  accessToken?: string;
  location?: { lat: number; lng: number } | null;
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

const SIDEBAR_WIDTH = 280;

// ─── Sidebar (conversation history) ─────────────────────────────────

function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onClose,
}: {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <View className="flex-1 bg-[#1e1e1e]">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-white/10">
        <Pressable
          onPress={onNew}
          className="flex-row items-center flex-1 px-3 py-2 rounded-lg border border-white/20 active:bg-white/5"
        >
          <MaterialIcons name="add" size={18} color="white" />
          <Text className="ml-2 text-sm text-white">Nouvelle conversation</Text>
        </Pressable>
        <Pressable onPress={onClose} className="ml-3 p-1">
          <MaterialIcons name="close" size={20} color="#999" />
        </Pressable>
      </View>

      {/* Conversation list */}
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingVertical: 8 }}
        ListEmptyComponent={
          <View className="px-4 py-8 items-center">
            <Text className="text-sm text-white/40">Aucune conversation</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => { onSelect(item.id); onClose(); }}
            className={`flex-row items-center px-4 py-3 mx-2 rounded-lg ${
              activeId === item.id ? "bg-white/10" : "active:bg-white/5"
            }`}
          >
            <MaterialIcons name="chat-bubble-outline" size={16} color="#999" />
            <Text
              className="flex-1 ml-3 text-sm text-white/80"
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Pressable
              onPress={() => onDelete(item.id)}
              className="p-1 active:bg-white/10 rounded"
            >
              <MaterialIcons name="delete-outline" size={16} color="#666" />
            </Pressable>
          </Pressable>
        )}
      />
    </View>
  );
}

// ─── Main ChatDrawer ─────────────────────────────────────────────────

export default function ChatDrawer({ visible, onClose, userId, accessToken, location }: Props) {
  const {
    messages, input, setInput, isLoading, isStreaming, error,
    append, handleSubmit, stop,
    conversations, activeConversationId,
    newConversation, loadConversation, deleteConversation,
  } = useChat({ userId, accessToken, location });

  const flatListRef = useRef<FlatList>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [messages]);

  // Animate sidebar
  useEffect(() => {
    Animated.timing(sidebarAnim, {
      toValue: sidebarOpen ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [sidebarOpen]);

  const sidebarTranslateX = sidebarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SIDEBAR_WIDTH, 0],
  });

  const handleSuggestion = useCallback((label: string) => {
    const query = SUGGESTION_QUERIES[label] ?? label;
    append(query);
  }, [append]);

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
          {/* Menu button */}
          <Pressable
            onPress={() => setSidebarOpen(true)}
            className="p-1.5 mr-2 rounded-lg active:bg-gray-100"
          >
            <MaterialIcons name="menu" size={20} color="#666" />
          </Pressable>

          <View className="w-7 h-7 rounded-full bg-[#b80035] items-center justify-center mr-2.5">
            <MaterialIcons name="favorite" size={14} color="white" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-gray-900">
              SangBot
            </Text>
            {isStreaming && (
              <Text className="text-xs text-[#b80035]">En train d'écrire...</Text>
            )}
          </View>
          <Pressable
            onPress={onClose}
            className="p-2 rounded-full active:bg-gray-100"
          >
            <MaterialIcons name="close" size={22} color="#666" />
          </Pressable>
        </View>

        {/* Chat content */}
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
                  onSendMessage={append}
                />
              )}
              contentContainerStyle={{ paddingTop: 12, paddingBottom: 8 }}
              ListFooterComponent={() => {
                if (error) {
                  return (
                    <View className="mx-4 my-2 p-3 bg-red-50 rounded-xl">
                      <Text className="text-sm text-red-600">{error}</Text>
                    </View>
                  );
                }
                if (isLoading && !isStreaming && messages.length > 0) {
                  return (
                    <View className="flex-row items-center px-4 py-2">
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

        {/* Sidebar overlay */}
        {sidebarOpen && (
          <Pressable
            className="absolute inset-0 bg-black/40"
            onPress={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar panel */}
        <Animated.View
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: SIDEBAR_WIDTH,
            transform: [{ translateX: sidebarTranslateX }],
            zIndex: 50,
          }}
        >
          <Sidebar
            conversations={conversations}
            activeId={activeConversationId}
            onSelect={loadConversation}
            onNew={newConversation}
            onDelete={deleteConversation}
            onClose={() => setSidebarOpen(false)}
          />
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
}
