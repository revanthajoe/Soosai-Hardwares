/**
 * Sitemap Controller
 * Generates dynamic XML sitemap from database products and categories
 */

const { Product, Category } = require('../models');
const { logger } = require('../config/logger');

const SITE_URL = 'https://soosai-hardwares.vercel.app';

// In-memory cache for sitemap XML
let sitemapCache = {
  xml: null,
  generatedAt: 0,
};

// Cache duration: 5 minutes (300,000 ms)
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Escape special XML characters to prevent malformed XML output.
 */
function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Format a date to W3C Datetime format (ISO 8601) for <lastmod>.
 */
function formatDate(dateStr) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch {
    return null;
  }
}

/**
 * Build a single <url> entry for the sitemap.
 */
function buildUrlEntry({ loc, lastmod, changefreq, priority }) {
  let entry = '  <url>\n';
  entry += `    <loc>${escapeXml(loc)}</loc>\n`;
  if (lastmod) {
    entry += `    <lastmod>${escapeXml(lastmod)}</lastmod>\n`;
  }
  if (changefreq) {
    entry += `    <changefreq>${escapeXml(changefreq)}</changefreq>\n`;
  }
  if (priority !== undefined && priority !== null) {
    entry += `    <priority>${priority}</priority>\n`;
  }
  entry += '  </url>\n';
  return entry;
}

/**
 * Generate the full sitemap XML by querying the database.
 * Uses a single query for products and a single query for categories.
 */
async function generateSitemapXml() {
  const urls = [];

  // 1. Static pages
  urls.push(buildUrlEntry({
    loc: `${SITE_URL}/`,
    changefreq: 'daily',
    priority: 1.0,
  }));

  urls.push(buildUrlEntry({
    loc: `${SITE_URL}/products`,
    changefreq: 'daily',
    priority: 0.8,
  }));

  // 2. Category pages — filter by category on the /products page
  // The frontend filters products by category using /products?category=<id>
  // Since there's no dedicated /category/:slug route, we use the query param approach.
  // However, for SEO these are not separate indexable pages with unique content.
  // Categories are used as filters on the products page.
  // We'll include them as filtered URLs: /products?category=<id>
  try {
    const categories = await Category.findAll('name', 'asc');
    if (categories && categories.length > 0) {
      for (const cat of categories) {
        urls.push(buildUrlEntry({
          loc: `${SITE_URL}/products?category=${cat.id}`,
          changefreq: 'weekly',
          priority: 0.7,
        }));
      }
    }
  } catch (err) {
    logger.error(`Sitemap: Failed to fetch categories: ${err.message}`);
    // Continue without categories — don't break the entire sitemap
  }

  // 3. Product pages — only active products
  // Single efficient query: fetch all active products with minimal fields
  try {
    const { supabase } = require('../config/db');
    const { data: products, error } = await supabase
      .from('products')
      .select('id, slug, updated_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (products && products.length > 0) {
      for (const product of products) {
        const lastmod = formatDate(product.updated_at);
        urls.push(buildUrlEntry({
          loc: `${SITE_URL}/products/${product.id}`,
          lastmod,
          changefreq: 'weekly',
          priority: 0.6,
        }));
      }
    }
  } catch (err) {
    logger.error(`Sitemap: Failed to fetch products: ${err.message}`);
    // Continue without products — don't break the entire sitemap
  }

  // Build the full XML
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  xml += urls.join('');
  xml += '</urlset>\n';

  return xml;
}

/**
 * GET /api/sitemap
 * Returns the dynamic sitemap as XML with caching.
 */
const getSitemap = async (req, res) => {
  try {
    const now = Date.now();

    // Serve from cache if still fresh
    if (sitemapCache.xml && (now - sitemapCache.generatedAt) < CACHE_TTL) {
      res.set('Content-Type', 'application/xml; charset=utf-8');
      res.set('Cache-Control', 'public, max-age=300, s-maxage=300');
      res.set('X-Sitemap-Cache', 'HIT');
      return res.status(200).send(sitemapCache.xml);
    }

    // Generate fresh sitemap
    const xml = await generateSitemapXml();

    // Update cache
    sitemapCache = {
      xml,
      generatedAt: now,
    };

    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=300, s-maxage=300');
    res.set('X-Sitemap-Cache', 'MISS');
    return res.status(200).send(xml);
  } catch (err) {
    logger.error(`Sitemap generation failed: ${err.message}`);

    // If cache exists but is stale, serve it as fallback
    if (sitemapCache.xml) {
      res.set('Content-Type', 'application/xml; charset=utf-8');
      res.set('Cache-Control', 'public, max-age=60');
      res.set('X-Sitemap-Cache', 'STALE');
      return res.status(200).send(sitemapCache.xml);
    }

    // Ultimate fallback: minimal static sitemap
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${escapeXml(SITE_URL)}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${escapeXml(SITE_URL)}/products</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
`;
    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=60');
    return res.status(200).send(fallbackXml);
  }
};

/**
 * Invalidate the sitemap cache.
 * Call this when products or categories change.
 */
const invalidateSitemapCache = () => {
  sitemapCache = { xml: null, generatedAt: 0 };
};

module.exports = {
  getSitemap,
  invalidateSitemapCache,
};
