-- =============================================================================
-- Migration: Remove permissive anonymous write policies
-- Date: 2026-09-06
--
-- !! DO NOT RUN THIS UNTIL SUPABASE_SERVICE_KEY ON RENDER HOLDS A REAL      !!
-- !! service_role KEY. Running it while the backend is still connecting     !!
-- !! with a publishable/anon key will break every write in the admin panel. !!
--
-- Background
-- ----------
-- Migrations 20260905000000, 20260905010000 and 20260905020000 granted the
-- `anon` role INSERT/UPDATE/DELETE with USING (true) on products, categories,
-- reviews, analytics and advertisements. That was a workaround for the backend
-- connecting with a publishable key instead of service_role, so Postgres was
-- rejecting its writes.
--
-- The side effect is that anybody holding the project's publishable key -- which
-- was committed to this repository in frontend/src/utils/supabase.js until this
-- change -- could write to every one of those tables directly over the Supabase
-- REST API, completely bypassing the Express `protect` middleware that is
-- supposed to be the only authorization gate.
--
-- The correct arrangement is: the backend authenticates as service_role (which
-- bypasses RLS entirely), and the anon role gets read-only access. This
-- migration restores that by dropping every anon write policy added above.
-- Public SELECT policies are deliberately left in place -- the storefront reads
-- through the backend, but read access is not a disclosure risk here and
-- removing it is a larger change.
--
-- Prerequisites, in order:
--   1. Rotate the Supabase API keys (the old publishable key is in git history).
--   2. Set SUPABASE_SERVICE_KEY on Render to the *service_role* key.
--   3. Redeploy the backend and confirm it is up.
--   4. Run this migration.
--   5. Verify create/update/delete still work from the admin dashboard.
-- =============================================================================

-- Products (from 20260905000000)
DROP POLICY IF EXISTS "Products are writable"   ON public.products;
DROP POLICY IF EXISTS "Products are updatable"  ON public.products;
DROP POLICY IF EXISTS "Products are deletable"  ON public.products;

-- Categories (from 20260905020000)
DROP POLICY IF EXISTS "Categories are writable"  ON public.categories;
DROP POLICY IF EXISTS "Categories are updatable" ON public.categories;
DROP POLICY IF EXISTS "Categories are deletable" ON public.categories;

-- Reviews (from 20260905020000)
-- Note: review submission is a public, unauthenticated feature, but it is
-- served by POST /api/reviews (rate-limited and validated), not by direct
-- anon writes, so dropping these is correct.
DROP POLICY IF EXISTS "Reviews are writable"  ON public.reviews;
DROP POLICY IF EXISTS "Reviews are deletable" ON public.reviews;

-- Analytics (from 20260905020000)
DROP POLICY IF EXISTS "Analytics are writable"  ON public.analytics;
DROP POLICY IF EXISTS "Analytics are updatable" ON public.analytics;

-- Advertisements (from 20260905010000)
DROP POLICY IF EXISTS "Advertisements are writable"  ON public.advertisements;
DROP POLICY IF EXISTS "Advertisements are updatable" ON public.advertisements;
DROP POLICY IF EXISTS "Advertisements are deletable" ON public.advertisements;

-- =============================================================================
-- Post-conditions: every table above keeps its public SELECT policy and has no
-- anon write policy. `users` keeps its existing "Deny public access to users"
-- FOR ALL USING (false) policy from 20260711000000.
-- =============================================================================
