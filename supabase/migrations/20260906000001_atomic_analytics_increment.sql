-- =============================================================================
-- Migration: Atomic analytics counter increment
-- Date: 2026-09-06
--
-- Analytics.increment() in backend/models/index.js was a read-then-write:
-- SELECT value, add one in JavaScript, UPDATE. Two visits landing in the same
-- window both read the same starting value and the second UPDATE overwrote the
-- first, so the visit and WhatsApp-order counters silently undercounted under
-- any concurrency.
--
-- This function does the whole thing in one statement inside Postgres, where
-- the row lock makes it atomic. The model calls it via supabase.rpc() and
-- falls back to the old read-then-write path if this function is absent, so
-- applying this migration is safe in either order relative to a deploy.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.increment_analytics(counter_id TEXT)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_value BIGINT;
BEGIN
  INSERT INTO public.analytics (id, value, updated_at)
  VALUES (counter_id, 1, now())
  ON CONFLICT (id) DO UPDATE
    SET value = public.analytics.value + 1,
        updated_at = now()
  RETURNING value INTO new_value;

  RETURN new_value;
END;
$$;

-- The backend connects as service_role, which can already execute this. Grant
-- to anon/authenticated as well so the counter keeps working if the API is
-- ever called with a lesser key.
GRANT EXECUTE ON FUNCTION public.increment_analytics(TEXT) TO anon, authenticated, service_role;

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
