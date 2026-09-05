/**
 * Security Headers Middleware
 * Adds security headers and CORS configuration
 */

const helmet = require('helmet');

// Origins permitted to call this API with credentials.
// CORS_ORIGIN accepts a comma-separated list; CLIENT_URL is the primary
// deployed frontend. Localhost dev servers are always allowed.
const allowedOrigins = [
  ...(process.env.CORS_ORIGIN || '').split(','),
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:4173',
]
  .map((value) => (value || '').trim().replace(/\/$/, ''))
  .filter(Boolean);

// Vercel gives every preview deployment of this project its own subdomain,
// so match them by pattern instead of enumerating them.
const VERCEL_PREVIEW = /^https:\/\/soosai-hardwares[a-z0-9-]*\.vercel\.app$/;

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Same-origin/non-browser requests (curl, health checks, server-to-server)
    // send no Origin header and are not subject to CORS.
    if (!origin) {
      return callback(null, true);
    }

    const normalized = origin.replace(/\/$/, '');

    if (allowedOrigins.includes(normalized) || VERCEL_PREVIEW.test(normalized)) {
      return callback(null, true);
    }

    // Reject by withholding the CORS headers rather than throwing, so a
    // disallowed origin gets a clean browser-side block instead of a 500.
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400, // 24 hours
};

// Security headers with Helmet
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
});

// Custom security headers
const customSecurityHeaders = (req, res, next) => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Feature policy (Permissions-Policy)
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  );
  
  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');
  
  next();
};

module.exports = {
  corsOptions,
  helmetConfig,
  customSecurityHeaders,
};
