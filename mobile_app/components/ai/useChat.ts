import { useState, useCallback, useRef } from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface UseChatOptions {
  apiUrl?: string;
  userId?: string;
  accessToken?: string;
}

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
  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);

  // Keep ref in sync for closures
  const syncRef = useCallback((msgs: ChatMessage[]) => {
    messagesRef.current = msgs;
    return msgs;
  }, []);

  const append = useCallback(
    async (content: string) => {
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
              if (parsed.type === "text-delta" && parsed.delta) {
                accumulated += parsed.delta;
                const currentText = accumulated;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: currentText } : m
                  )
                );
              } else if (parsed.type === "error") {
                setError(sanitizeChatError(parsed.errorText));
              }
            } catch {
              // skip malformed
            }
          }
        }

        // Final sync
        messagesRef.current = messagesRef.current.map((m) =>
          m.id === assistantId ? { ...m, content: accumulated } : m
        );
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(sanitizeChatError(err instanceof Error ? err.message : undefined));
      } finally {
        setIsLoading(false);
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [apiUrl, options.userId, options.accessToken, syncRef]
  );

  const stop = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsLoading(false);
    setIsStreaming(false);
  }, []);

  const clear = useCallback(() => {
    stop();
    setMessages(syncRef([]));
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
  };
}
