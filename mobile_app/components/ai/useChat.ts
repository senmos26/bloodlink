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

      const updatedMessages = [...messagesRef.current, userMsg];
      setMessages(syncRef(updatedMessages));
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
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
            ...(options.accessToken
              ? { Authorization: `Bearer ${options.accessToken}` }
              : {}),
          },
          body: JSON.stringify({
            messages: updatedMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            userId: options.userId,
            location: options.location,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Erreur ${response.status}`);
        }

        if (!response.body) {
          throw new Error("Réponse vide");
        }

        const assistantId = generateId();
        const withAssistant = [...updatedMessages, { id: assistantId, role: "assistant" as const, content: "" }];
        setMessages(syncRef(withAssistant));
        setIsStreaming(true);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulated = "";
        let lastRendered = "";
        let lastRenderAt = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);

              // UI Message Stream protocol (AI SDK)
              if (parsed.type === "text-delta" && parsed.delta) {
                accumulated += parsed.delta;
                let currentText = normalizeStreamText(accumulated);
                accumulated = currentText;
                if (currentText === lastRendered) continue;
                lastRendered = currentText;
                const now = Date.now();
                if (now - lastRenderAt > 32) {
                  lastRenderAt = now;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId ? { ...m, content: currentText } : m
                    )
                  );
                }
              } else if (parsed.type === "error") {
                setError(sanitizeChatError(parsed.errorText));
              }
              // Tool call results are handled server-side and included in text
              // No special client handling needed — they appear as text-delta
            } catch {
              // skip malformed chunks
            }
          }
        }

        // Final sync + persist assistant message
        const finalText = normalizeStreamText(accumulated);
        messagesRef.current = messagesRef.current.map((m) =>
          m.id === assistantId ? { ...m, content: finalText } : m
        );
        setMessages(syncRef(messagesRef.current));

        if (convId && finalText) {
          void persistMessage(convId, { id: assistantId, role: "assistant", content: finalText });
          refreshConversationsSoon();
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(sanitizeChatError(err instanceof Error ? err.message : undefined));
      } finally {
        setIsLoading(false);
        setIsStreaming(false);
        abortRef.current = null;
        sendingRef.current = false;
      }
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
  }, []);

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
