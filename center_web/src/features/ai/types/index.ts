export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: string;
}

export interface ChatContext {
  userId?: string;
  fullName?: string | null;
  bloodType?: string | null;
  nextDonationDate?: string | null;
  recentDonations?: number;
  location?: { lat: number; lng: number } | null;
}

export interface RagResult {
  id: string;
  content: string;
  category: string;
  metadata: Record<string, unknown>;
  similarity: number;
}

export interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
}
