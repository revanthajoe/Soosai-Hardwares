const express = require('express');
const { getSitemap } = require('../controllers/sitemapController');

const router = express.Router();

/**
 * GET /api/sitemap
 * Returns the dynamically generated sitemap XML.
 * This endpoint is public and does not require authentication.
 */
router.get('/', getSitemap);

module.exports = router;
