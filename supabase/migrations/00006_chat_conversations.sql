-- Chat conversations & messages persistence for SangBot AI
CREATE TABLE IF NOT EXISTS chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Nouvelle conversation',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_chat_conversations_user ON chat_conversations(user_id, updated_at DESC);
CREATE INDEX idx_chat_messages_conversation ON chat_messages(conversation_id, created_at ASC);

-- RLS
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Users can only see their own conversations
CREATE POLICY "Users see own conversations"
  ON chat_conversations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own conversations"
  ON chat_conversations FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own conversations"
  ON chat_conversations FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users delete own conversations"
  ON chat_conversations FOR DELETE
  USING (user_id = auth.uid());

-- Messages follow conversation ownership
CREATE POLICY "Users see messages in own conversations"
  ON chat_messages FOR SELECT
  USING (conversation_id IN (SELECT id FROM chat_conversations WHERE user_id = auth.uid()));

CREATE POLICY "Users insert messages in own conversations"
  ON chat_messages FOR INSERT
  WITH CHECK (conversation_id IN (SELECT id FROM chat_conversations WHERE user_id = auth.uid()));

CREATE POLICY "Users delete messages in own conversations"
  ON chat_messages FOR DELETE
  USING (conversation_id IN (SELECT id FROM chat_conversations WHERE user_id = auth.uid()));

-- Auto-update updated_at on new message
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS trigger AS $$
BEGIN
  UPDATE chat_conversations SET updated_at = now() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_update_conversation_on_message
  AFTER INSERT ON chat_messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_timestamp();

-- Helper: auto-generate title from first user message
CREATE OR REPLACE FUNCTION auto_title_conversation()
RETURNS trigger AS $$
BEGIN
  IF NEW.role = 'user' THEN
    UPDATE chat_conversations
    SET title = left(NEW.content, 50)
    WHERE id = NEW.conversation_id AND title = 'Nouvelle conversation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_auto_title_on_first_message
  AFTER INSERT ON chat_messages
  FOR EACH ROW EXECUTE FUNCTION auto_title_conversation();
