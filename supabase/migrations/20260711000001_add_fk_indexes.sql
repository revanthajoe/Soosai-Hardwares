-- =============================================================================
-- Migration: Add Missing Indexes on Foreign Keys
-- Date: 2026-07-11
-- Issues Fixed:
--   1. Unindexed foreign keys: public.products.category_id
--   2. Unindexed foreign keys: public.reviews.product_id
-- =============================================================================

-- Create index on products.category_id to optimize joins and lookups by category
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);

-- Create index on reviews.product_id to optimize fetching reviews for a specific product
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
