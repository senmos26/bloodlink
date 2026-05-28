import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/services/supabase";

// ─── Types ──────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

interface UseChatOptions {
  apiUrl?: string;
  userId?: string;
  accessToken?: string;
  location?: { lat: number; lng: number } | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────

let _msgCounter = 0;
function generateId() {
  return `msg-${Date.now()}-${++_msgCounter}`;
}

function sanitizeChatError(message?: string) {
  const raw = message ?? "";
  const lower = raw.toLowerCase();

  if (
    lower.includes("rate limit") ||
    lower.includes("free-models-per-day") ||
    lower.includes("too many requests")
  ) {
    return "SangBot est temporairement indisponible. Réessayez dans quelques minutes.";
  }

  if (lower.includes("fetch failed") || lower.includes("network")) {
    return "Connexion impossible. Vérifiez votre réseau puis réessayez.";
  }

  if (raw.startsWith("Erreur ")) {
    return raw;
  }

  return "Une erreur est survenue. Réessayez dans un instant.";
}

function removeExactRepeatedHalves(text: string) {
  const trimmed = text.trimEnd();
  const half = Math.floor(trimmed.length / 2);
  if (
    trimmed.length > 80 &&
    trimmed.length % 2 === 0 &&
    trimmed.slice(0, half).trim() === trimmed.slice(half).trim()
  ) {
    return trimmed.slice(0, half).trimEnd();
  }
  return text;
}

function removeRepeatedTrailingParagraph(text: string) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (paragraphs.length >= 2) {
    const last = paragraphs[paragraphs.length - 1];
    const previous = paragraphs[paragraphs.length - 2];
    if (last.length > 40 && last === previous) {
      return text.slice(0, text.lastIndexOf(last)).trimEnd();
    }
  }

  const sentencePattern = /([^.!?。！？\n]{30,}[.!?。！？])\s*$/;
  const match = text.match(sentencePattern);
  if (!match) return text;

  const lastSentence = match[1].trim();
  const beforeLast = text.slice(0, match.index).trimEnd();
  if (beforeLast.endsWith(lastSentence)) {
    return beforeLast;
  }

  return text;
}

function removeRepeatedSentences(text: string) {
  const parts = text.match(/[^.!?。！？]+[.!?。！？]+|\s*[^.!?。！？]+$/g);
  if (!parts || parts.length < 2) return text;

  const seen = new Set<string>();
  const result: string[] = [];

  for (const part of parts) {
    const normalized = part.replace(/\s+/g, " ").trim().toLowerCase();
    if (normalized.length > 35 && seen.has(normalized)) {
      continue;
    }
    if (normalized.length > 35) {
      seen.add(normalized);
    }
    result.push(part);
  }

  return result.join("").trimStart();
}

function normalizeStreamText(text: string) {
  return removeRepeatedSentences(
    removeRepeatedTrailingParagraph(removeExactRepeatedHalves(text))
  );
}

// ─── Hook ────────────────────────────────────────────────────────────

export function useChat(options: UseChatOptions = {}) {
  const apiUrl =
    options.apiUrl ??
    (process.env.EXPO_PUBLIC_CENTER_WEB_URL || "http://localhost:3000") +
      "/api/chat";

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const sendingRef = useRef(false);
  const messagesRef = useRef<ChatMessage[]>([]);

  const syncRef = useCallback((msgs: ChatMessage[]) => {
    messagesRef.current = msgs;
    return msgs;
  }, []);

  // ── Load conversations list ──
  const loadConversations = useCallback(async () => {
    if (!options.userId) return;
    const { data } = await supabase
      .from("chat_conversations")
      .select("id, title, updated_at")
      .eq("user_id", options.userId)
      .order("updated_at", { ascending: false })
      .limit(20);
    if (data) setConversations(data);
  }, [options.userId]);

  // ── Load messages for a conversation ──
  const loadConversation = useCallback(async (convId: string) => {
    const { data } = await supabase
      .from("chat_messages")
      .select("id, role, content, created_at")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });
    if (data) {
      const msgs: ChatMessage[] = data.map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
      }));
      setMessages(syncRef(msgs));
      setActiveConversationId(convId);
    }
  }, [syncRef]);

  // ── Persist a message to DB ──
  const persistMessage = useCallback(async (convId: string, msg: ChatMessage) => {
    await supabase
      .from("chat_messages")
      .insert({
        conversation_id: convId,
        role: msg.role,
        content: msg.content,
      })
  }, []);

  const refreshConversationsSoon = useCallback(() => {
    setTimeout(() => loadConversations(), 250);
  }, [loadConversations]);

  // ── Create new conversation ──
  const newConversation = useCallback(() => {
    stop();
    setMessages(syncRef([]));
    setActiveConversationId(null);
    setError(null);
  }, [syncRef]);

  // ── Delete conversation ──
  const deleteConversation = useCallback(async (convId: string) => {
    await supabase.from("chat_conversations").delete().eq("id", convId);
    if (activeConversationId === convId) {
      setMessages(syncRef([]));
      setActiveConversationId(null);
    }
    loadConversations();
  }, [activeConversationId, loadConversations, syncRef]);

  // ── Load conversations on mount ──
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // ── Main append (send message + stream response) ──
  const append = useCallback(
    async (content: string) => {
      if (sendingRef.current || isLoading) return;
      sendingRef.current = true;

      const userMsg: ChatMessage = {
        id: generateId(),
        role: "user",
        content,
      };

      const assistantId = generateId();
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
      };

      const updatedMessages = [...messagesRef.current, userMsg];
      const streamingMessages = [...updatedMessages, assistantMsg];
      
      // Update local state with both user message and empty assistant message
      setMessages(syncRef(streamingMessages));
      setInput("");
      setIsLoading(true);
      setIsStreaming(false);
      setError(null);

      // Ensure we have a conversation ID (create if needed)
      let convId = activeConversationId;
      if (!convId && options.userId) {
        const { data } = await supabase
          .from("chat_conversations")
          .insert({ user_id: options.userId, title: "Nouvelle conversation" })
          .select("id")
          .single();
        if (data) {
          convId = data.id;
          setActiveConversationId(convId);
        }
      }

      // Persist user message
      if (convId) void persistMessage(convId, userMsg);

      if (abortRef.current) abortRef.current.abort();
      const xhr = new XMLHttpRequest();
      abortRef.current = { abort: () => xhr.abort() };

      let offset = 0;
      let accumulated = "";
      let lastRendered = "";
      let lastRenderAt = 0;

      xhr.onreadystatechange = () => {
        if (xhr.readyState === 3 || xhr.readyState === 4) {
          if (xhr.status >= 400) {
            setError(sanitizeChatError(`Erreur ${xhr.status}`));
            setIsLoading(false);
            setIsStreaming(false);
            sendingRef.current = false;
            if (!accumulated) {
              messagesRef.current = messagesRef.current.filter((m) => m.id !== assistantId);
              setMessages(syncRef(messagesRef.current));
            }
            return;
          }

          const responseText = xhr.responseText;
          const chunk = responseText.slice(offset);
          offset = responseText.length;

          if (chunk) {
            setIsStreaming(true);
            const lines = chunk.split("\n");
            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const data = line.slice(6).trim();
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                if (parsed.type === "text-delta" && parsed.delta) {
                  accumulated += parsed.delta;
                  let currentText = normalizeStreamText(accumulated);
                  accumulated = currentText;
                  if (currentText === lastRendered) continue;
                  lastRendered = currentText;

                  const now = Date.now();
                  if (now - lastRenderAt > 32 || xhr.readyState === 4) {
                    lastRenderAt = now;
                    messagesRef.current = messagesRef.current.map((m) =>
                      m.id === assistantId ? { ...m, content: currentText } : m
                    );
                    setMessages([...messagesRef.current]);
                  }
                } else if (parsed.type === "error") {
                  setError(sanitizeChatError(parsed.errorText));
                  if (!accumulated) {
                    messagesRef.current = messagesRef.current.filter((m) => m.id !== assistantId);
                    setMessages(syncRef(messagesRef.current));
                  }
                }
              } catch {
                // Ignore incomplete JSON chunk errors
              }
            }
          }
        }

        if (xhr.readyState === 4) {
          const finalText = normalizeStreamText(accumulated);
          messagesRef.current = messagesRef.current.map((m) =>
            m.id === assistantId ? { ...m, content: finalText } : m
          );
          setMessages(syncRef(messagesRef.current));

          if (convId && finalText) {
            void persistMessage(convId, { id: assistantId, role: "assistant", content: finalText });
            refreshConversationsSoon();
          }

          setIsLoading(false);
          setIsStreaming(false);
          abortRef.current = null;
          sendingRef.current = false;
        }
      };

      xhr.onerror = () => {
        setError(sanitizeChatError("Network request failed"));
        setIsLoading(false);
        setIsStreaming(false);
        sendingRef.current = false;
        if (!accumulated) {
          messagesRef.current = messagesRef.current.filter((m) => m.id !== assistantId);
          setMessages(syncRef(messagesRef.current));
        }
      };

      xhr.open("POST", apiUrl);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.setRequestHeader("Accept", "text/event-stream");
      if (options.accessToken) {
        xhr.setRequestHeader("Authorization", `Bearer ${options.accessToken}`);
      }

      xhr.send(
        JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          userId: options.userId,
          location: options.location,
        })
      );
    },
    [apiUrl, options.userId, options.accessToken, options.location, activeConversationId, isLoading, syncRef, persistMessage, refreshConversationsSoon]
  );

  const stop = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsLoading(false);
    setIsStreaming(false);
    sendingRef.current = false;

    // Remove empty assistant message if streaming was stopped before receiving data
    const lastMsg = messagesRef.current[messagesRef.current.length - 1];
    if (lastMsg && lastMsg.role === "assistant" && !lastMsg.content.trim()) {
      messagesRef.current = messagesRef.current.slice(0, -1);
      setMessages(syncRef(messagesRef.current));
    }
  }, [syncRef]);

  const clear = useCallback(() => {
    stop();
    setMessages(syncRef([]));
    setActiveConversationId(null);
    setError(null);
  }, [stop, syncRef]);

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    append(trimmed);
  }, [input, isLoading, append]);

  return {
    messages,
    input,
    setInput,
    isLoading,
    isStreaming,
    error,
    append,
    stop,
    clear,
    handleSubmit,
    // Conversation management
    conversations,
    activeConversationId,
    newConversation,
    loadConversation,
    deleteConversation,
    loadConversations,
  };
}
