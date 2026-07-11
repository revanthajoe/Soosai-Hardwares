-- =============================================================================
-- Migration: Fix All RLS & Security Linter Warnings
-- Date: 2026-07-11
-- Issues Fixed:
--   1. RLS Disabled in Public: public.categories
--   2. RLS Disabled in Public: public.products
--   3. RLS Disabled in Public: public.reviews
--   4. RLS Disabled in Public: public.analytics
--   5. Public Can Execute SECURITY DEFINER Function: public.rls_auto_enable()
--   6. Signed-In Users Can Execute SECURITY DEFINER Function: public.rls_auto_enable()
--   7. RLS Enabled No Policy: public.users
-- =============================================================================


-- =============================================================================
-- PART 1: Enable RLS on all public tables (fixes issues 1-4)
-- Using IF NOT EXISTS equivalent: these are idempotent — safe to re-run
-- =============================================================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics  ENABLE ROW LEVEL SECURITY;


-- =============================================================================
-- PART 2: Public read-only policies for store tables (fixes issues 1-4)
-- Write access is handled exclusively by the backend via service_role key,
-- which bypasses RLS automatically — no write policies needed here.
-- Drop-then-create pattern makes this safe to re-run.
-- =============================================================================

-- Categories
DROP POLICY IF EXISTS "Categories are publicly readable" ON public.categories;
CREATE POLICY "Categories are publicly readable"
  ON public.categories
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Products
DROP POLICY IF EXISTS "Products are publicly readable" ON public.products;
CREATE POLICY "Products are publicly readable"
  ON public.products
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Reviews
DROP POLICY IF EXISTS "Reviews are publicly readable" ON public.reviews;
CREATE POLICY "Reviews are publicly readable"
  ON public.reviews
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Analytics (only SELECT — write is backend-only via service_role)
DROP POLICY IF EXISTS "Analytics are publicly readable" ON public.analytics;
CREATE POLICY "Analytics are publicly readable"
  ON public.analytics
  FOR SELECT
  TO anon, authenticated
  USING (true);


-- =============================================================================
-- PART 3: Users table policies (fixes issue 7 — RLS enabled, no policies)
-- RLS is already enabled on public.users; we just need the policies.
-- =============================================================================

-- App uses custom auth in the backend (integer IDs), not Supabase Auth (UUIDs).
-- All auth operations go through the backend service_role which bypasses RLS.
-- We explicitly deny all direct public/client access to satisfy the linter.

DROP POLICY IF EXISTS "Deny public access to users" ON public.users;
CREATE POLICY "Deny public access to users"
  ON public.users
  FOR ALL
  TO anon, authenticated
  USING (false);

-- NOTE: INSERT and DELETE on public.users are intentionally not granted to
-- anon/authenticated. New user rows are created via the Supabase Auth trigger
-- (handle_new_user) which runs as the service_role and bypasses RLS.
-- Deletion is also backend-only for safety.


-- =============================================================================
-- PART 4: Revoke EXECUTE on the SECURITY DEFINER helper function (fixes 5 & 6)
-- rls_auto_enable() was exposed to PostgREST — revoke it from public roles.
-- The function can still be called by the service_role / postgres superuser.
-- =============================================================================

REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC; -- safety net: revoke from all

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
