-- Migration: create IsokoLink relationship layer for cross-entity discovery.
-- This is a reusable connection table and does not replace the marketplace tables.

BEGIN;

CREATE TABLE IF NOT EXISTS public.isokolink_relations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL,
  source_id uuid NOT NULL,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  relationship text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_type, source_id, target_type, target_id, relationship)
);

ALTER TABLE public.isokolink_relations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS isokolink_relations_public_read ON public.isokolink_relations;
CREATE POLICY isokolink_relations_public_read
  ON public.isokolink_relations FOR SELECT USING (true);

DROP POLICY IF EXISTS isokolink_relations_authenticated_insert ON public.isokolink_relations;
CREATE POLICY isokolink_relations_authenticated_insert
  ON public.isokolink_relations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS isokolink_relations_owner_update ON public.isokolink_relations;
CREATE POLICY isokolink_relations_owner_update
  ON public.isokolink_relations FOR UPDATE
  USING (auth.uid() = created_by OR auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() = created_by OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS isokolink_relations_admin_manage ON public.isokolink_relations;
CREATE POLICY isokolink_relations_admin_manage
  ON public.isokolink_relations FOR ALL
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

CREATE INDEX IF NOT EXISTS isokolink_relations_source_idx
  ON public.isokolink_relations(source_type, source_id);
CREATE INDEX IF NOT EXISTS isokolink_relations_target_idx
  ON public.isokolink_relations(target_type, target_id);
CREATE INDEX IF NOT EXISTS isokolink_relations_relationship_idx
  ON public.isokolink_relations(relationship);

COMMIT;
