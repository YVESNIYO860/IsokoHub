-- Migration: create shared user capability model for future multi-service roles.
-- This is additive and intentionally keeps the current marketplace working.

BEGIN;

CREATE TABLE IF NOT EXISTS public.user_capabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  capability text NOT NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  granted_by uuid,
  UNIQUE (user_id, capability)
);

ALTER TABLE public.user_capabilities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_capabilities_self_read ON public.user_capabilities;
CREATE POLICY user_capabilities_self_read
  ON public.user_capabilities FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS user_capabilities_self_insert ON public.user_capabilities;
CREATE POLICY user_capabilities_self_insert
  ON public.user_capabilities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS user_capabilities_self_update ON public.user_capabilities;
CREATE POLICY user_capabilities_self_update
  ON public.user_capabilities FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS user_capabilities_admin_manage ON public.user_capabilities;
CREATE POLICY user_capabilities_admin_manage
  ON public.user_capabilities FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS user_capabilities_user_idx
  ON public.user_capabilities(user_id);
CREATE INDEX IF NOT EXISTS user_capabilities_capability_idx
  ON public.user_capabilities(capability);

COMMIT;
