-- Enable Row Level Security (RLS) on all tables to prevent unauthorized access
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Policies for public READ access (anon & authenticated)
-- -----------------------------------------------------------------------------

-- Categories are publicly readable
CREATE POLICY "Categories are publicly readable"
ON public.categories
FOR SELECT
TO anon, authenticated
USING (true);

-- Products are publicly readable
CREATE POLICY "Products are publicly readable"
ON public.products
FOR SELECT
TO anon, authenticated
USING (true);

-- Reviews are publicly readable
CREATE POLICY "Reviews are publicly readable"
ON public.reviews
FOR SELECT
TO anon, authenticated
USING (true);

-- Analytics are publicly readable (Optional: Remove if analytics should be private)
CREATE POLICY "Analytics are publicly readable"
ON public.analytics
FOR SELECT
TO anon, authenticated
USING (true);

-- -----------------------------------------------------------------------------
-- Note on Write Access (INSERT / UPDATE / DELETE):
-- By default, enabling RLS without write policies blocks all writes from the 
-- public API (anon / authenticated roles). 
-- Since the Soosai Hardwares application uses a backend Express server that 
-- communicates with Supabase using the SUPABASE_SERVICE_ROLE_KEY, the backend 
-- will automatically bypass RLS and still be able to perform all write operations 
-- securely. Ensure that your backend .env uses the actual service_role key.
-- -----------------------------------------------------------------------------
