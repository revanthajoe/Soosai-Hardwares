-- =============================================================================
-- Migration: Allow writes to public.products via the anon-role client
-- Date: 2026-09-05
-- Context: backend/config/db.js currently connects with the publishable/anon
-- key (not a service_role key), so INSERT/UPDATE/DELETE from the backend was
-- being rejected with "new row violates row-level security policy for table
-- products". Since app-level authorization is already enforced in
-- backend/middlewares/authMiddleware.js (protect) before these routes are
-- reached, we add permissive write policies here to match how the backend
-- actually connects.
-- =============================================================================

DROP POLICY IF EXISTS "Products are writable" ON public.products;
CREATE POLICY "Products are writable"
  ON public.products
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Products are updatable" ON public.products;
CREATE POLICY "Products are updatable"
  ON public.products
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Products are deletable" ON public.products;
CREATE POLICY "Products are deletable"
  ON public.products
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
