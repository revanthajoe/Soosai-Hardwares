-- =============================================================================
-- Migration: Fix remaining tables missing write RLS policies
-- Date: 2026-09-05
-- The 20260905000000 migration fixed `products` (which only had a SELECT
-- policy, causing "new row violates row-level security policy"). The same
-- gap existed on categories, reviews, and analytics — they were only ever
-- given a public SELECT policy (see 20260711000000_fix_rls_and_security.sql),
-- so every INSERT/UPDATE from the backend (which connects with the anon key,
-- not service_role) was silently rejected by Postgres:
--   - Admin "Add Category" -> RLS violation on categories
--   - Public "Add Review" -> RLS violation on reviews
--   - Homepage visit / WhatsApp-order counters -> RLS violation on analytics
--     (and the two default analytics rows were never successfully seeded,
--     causing a secondary ".single()" coercion error on every increment)
-- As with products/advertisements, real authorization is enforced by the
-- Express `protect` middleware, not by Postgres RLS predicates, so these
-- policies are intentionally permissive for anon/authenticated.
-- =============================================================================

-- Categories
DROP POLICY IF EXISTS "Categories are writable" ON public.categories;
CREATE POLICY "Categories are writable"
  ON public.categories
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Categories are updatable" ON public.categories;
CREATE POLICY "Categories are updatable"
  ON public.categories
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Categories are deletable" ON public.categories;
CREATE POLICY "Categories are deletable"
  ON public.categories
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- Reviews
DROP POLICY IF EXISTS "Reviews are writable" ON public.reviews;
CREATE POLICY "Reviews are writable"
  ON public.reviews
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Reviews are deletable" ON public.reviews;
CREATE POLICY "Reviews are deletable"
  ON public.reviews
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- Analytics
DROP POLICY IF EXISTS "Analytics are writable" ON public.analytics;
CREATE POLICY "Analytics are writable"
  ON public.analytics
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Analytics are updatable" ON public.analytics;
CREATE POLICY "Analytics are updatable"
  ON public.analytics
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Seed the default analytics counters directly (the app's initSchema() tried
-- to do this via upsert on every boot, but that upsert was itself silently
-- rejected by RLS before this migration, so the rows never existed).
INSERT INTO public.analytics (id, value)
VALUES ('visits', 0), ('whatsapp_orders', 0)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
