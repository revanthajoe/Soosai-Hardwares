-- =============================================================================
-- Migration: Create advertisements table for homepage ad carousel
-- Date: 2026-09-05
-- Admin-managed image/gif/video promo media, shown on the homepage below the
-- hero banner. Backend connects with the anon/publishable key (see
-- 20260905000000_add_products_write_policies.sql), so write policies here are
-- permissive and real authorization happens via Express's `protect` middleware.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.advertisements (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'gif', 'video')),
  link_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_advertisements_active_order
  ON public.advertisements (is_active, display_order);

ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Advertisements are readable" ON public.advertisements;
CREATE POLICY "Advertisements are readable"
  ON public.advertisements
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Advertisements are writable" ON public.advertisements;
CREATE POLICY "Advertisements are writable"
  ON public.advertisements
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Advertisements are updatable" ON public.advertisements;
CREATE POLICY "Advertisements are updatable"
  ON public.advertisements
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Advertisements are deletable" ON public.advertisements;
CREATE POLICY "Advertisements are deletable"
  ON public.advertisements
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
