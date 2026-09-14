-- Marketplace chat: demo-name visitor conversations with admin visibility.
-- Run in Supabase SQL Editor after the existing migrations.

BEGIN;

CREATE TABLE IF NOT EXISTS public.marketplace_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  seller_id uuid,
  visitor_id text NOT NULL,
  visitor_name text NOT NULL,
  seller_name text,
  product_name text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketplace_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.marketplace_conversations(id) ON DELETE CASCADE,
  sender_id uuid,
  sender_name text NOT NULL,
  sender_role text NOT NULL CHECK (sender_role IN ('visitor', 'seller', 'admin')),
  body text NOT NULL CHECK (char_length(trim(body)) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS marketplace_conversations_product_idx
  ON public.marketplace_conversations(product_id);
CREATE INDEX IF NOT EXISTS marketplace_conversations_visitor_idx
  ON public.marketplace_conversations(visitor_id);
CREATE INDEX IF NOT EXISTS marketplace_messages_conversation_idx
  ON public.marketplace_messages(conversation_id, created_at);

ALTER TABLE public.marketplace_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_messages ENABLE ROW LEVEL SECURITY;

-- Demo-name visitors are intentionally not authenticated, so conversation/message
-- reads remain public for this product's current chat model. Writes are restricted
-- to the expected visitor/seller roles and arbitrary conversation updates are removed.
DROP POLICY IF EXISTS marketplace_conversations_public_read ON public.marketplace_conversations;
CREATE POLICY marketplace_conversations_public_read
  ON public.marketplace_conversations FOR SELECT USING (true);

DROP POLICY IF EXISTS marketplace_conversations_public_insert ON public.marketplace_conversations;
CREATE POLICY marketplace_conversations_public_insert
  ON public.marketplace_conversations FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS marketplace_conversations_public_update ON public.marketplace_conversations;

DROP POLICY IF EXISTS marketplace_messages_public_read ON public.marketplace_messages;
CREATE POLICY marketplace_messages_public_read
  ON public.marketplace_messages FOR SELECT USING (true);

DROP POLICY IF EXISTS marketplace_messages_public_insert ON public.marketplace_messages;
CREATE POLICY marketplace_messages_public_insert
  ON public.marketplace_messages FOR INSERT
  WITH CHECK (sender_role = 'visitor' AND sender_id IS NULL);

DROP POLICY IF EXISTS marketplace_messages_seller_insert ON public.marketplace_messages;
CREATE POLICY marketplace_messages_seller_insert
  ON public.marketplace_messages FOR INSERT TO authenticated
  WITH CHECK (sender_role = 'seller' AND sender_id = auth.uid());

CREATE OR REPLACE FUNCTION public.update_marketplace_conversation_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.marketplace_conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS marketplace_message_timestamp ON public.marketplace_messages;
CREATE TRIGGER marketplace_message_timestamp
AFTER INSERT ON public.marketplace_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_marketplace_conversation_timestamp();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'marketplace_conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.marketplace_conversations;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'marketplace_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.marketplace_messages;
  END IF;
END $$;

COMMIT;
