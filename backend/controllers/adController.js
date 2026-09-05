/**
 * Advertisement Controller
 * Handles homepage ad CRUD operations (image/gif/video) with validation and error handling
 */

const { Advertisement } = require('../models');
const { logger } = require('../config/logger');
const { deleteFromCloudinary, getPublicIdFromUrl } = require('../config/cloudinary');
const asyncHandler = require('../utils/asyncHandler');

// Simple in-memory cache to reduce database queries
const cache = new Map();
const CACHE_TTL_MS = 30 * 1000;

const mediaTypeFromMimetype = (mimetype) => {
  if (mimetype === 'video/mp4' || mimetype === 'video/webm') return 'video';
  if (mimetype === 'image/gif') return 'gif';
  return 'image';
};

const mediaTypeFromUrl = (url) => {
  const ext = (url.split('?')[0].split('.').pop() || '').toLowerCase();
  if (['mp4', 'webm', 'mov', 'm4v'].includes(ext)) return 'video';
  if (ext === 'gif') return 'gif';
  return 'image';
};

const VALID_MEDIA_TYPES = ['image', 'gif', 'video'];

const resourceTypeForMediaType = (mediaType) => (mediaType === 'video' ? 'video' : 'image');

/**
 * @swagger
 * /api/ads:
 *   get:
 *     summary: Get active advertisements (public, ordered for the homepage carousel)
 *     tags: [Advertisements]
 *     responses:
 *       200:
 *         description: List of active advertisements
 */
const getAds = asyncHandler(async (req, res) => {
  const cacheKey = 'ads:active';
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return res.status(200).json({ success: true, data: cached.data });
  }

  const ads = await Advertisement.findAll({ activeOnly: true });
  cache.set(cacheKey, { data: ads, expiresAt: Date.now() + CACHE_TTL_MS });

  res.status(200).json({ success: true, data: ads });
});

/**
 * @swagger
 * /api/ads/admin:
 *   get:
 *     summary: Get all advertisements including inactive ones (admin only)
 *     tags: [Advertisements]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all advertisements
 */
const getAdminAds = asyncHandler(async (req, res) => {
  const ads = await Advertisement.findAll({ activeOnly: false });
  res.status(200).json({ success: true, data: ads });
});

/**
 * @swagger
 * /api/ads:
 *   post:
 *     summary: Create advertisement
 *     tags: [Advertisements]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - media
 *             properties:
 *               title:
 *                 type: string
 *               linkUrl:
 *                 type: string
 *               media:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Advertisement created
 *       400:
 *         description: Validation error
 */
const createAd = asyncHandler(async (req, res) => {
  const { title, linkUrl, mediaUrl, mediaType: mediaTypeOverride } = req.body;

  let media_url;
  let media_type;

  if (req.cloudinaryUrl) {
    media_url = req.cloudinaryUrl;
    media_type = mediaTypeFromMimetype(req.file?.mimetype);
  } else if (mediaUrl) {
    media_url = mediaUrl.trim();
    media_type = VALID_MEDIA_TYPES.includes(mediaTypeOverride)
      ? mediaTypeOverride
      : mediaTypeFromUrl(media_url);
  } else {
    return res.status(400).json({
      success: false,
      message: 'A media file or media URL is required.',
      statusCode: 400,
    });
  }

  const maxOrder = await Advertisement.getMaxDisplayOrder();

  const ad = await Advertisement.create({
    title: (title || '').trim(),
    media_url,
    media_type,
    link_url: (linkUrl || '').trim() || null,
    display_order: maxOrder + 1,
    is_active: true,
  });

  cache.clear();
  logger.info(`Advertisement created: ${ad.id}`);

  res.status(201).json({
    success: true,
    message: 'Advertisement created successfully',
    data: ad,
  });
});

/**
 * @swagger
 * /api/ads/{id}:
 *   put:
 *     summary: Update advertisement
 *     tags: [Advertisements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               linkUrl:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               media:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Advertisement updated
 *       404:
 *         description: Advertisement not found
 */
const updateAd = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, linkUrl, isActive, mediaUrl, mediaType: mediaTypeOverride } = req.body;

  const adId = parseInt(id);
  if (isNaN(adId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid advertisement ID',
      statusCode: 400,
    });
  }

  const existingAd = await Advertisement.findById(adId);
  if (!existingAd) {
    return res.status(404).json({
      success: false,
      message: 'Advertisement not found',
      statusCode: 404,
    });
  }

  const updates = {};
  if (title !== undefined) updates.title = (title || '').trim();
  if (linkUrl !== undefined) updates.link_url = (linkUrl || '').trim() || null;
  if (isActive !== undefined) updates.is_active = isActive === 'true' || isActive === true;

  const newMediaUrl = req.cloudinaryUrl || (mediaUrl ? mediaUrl.trim() : null);

  if (newMediaUrl) {
    const oldPublicId = getPublicIdFromUrl(existingAd.mediaUrl);
    if (oldPublicId) {
      try {
        await deleteFromCloudinary(oldPublicId, resourceTypeForMediaType(existingAd.mediaType));
        logger.info(`Deleted old Cloudinary ad media: ${oldPublicId}`);
      } catch (err) {
        logger.warn(`Failed to delete old Cloudinary ad media: ${err.message}`);
      }
    }
    updates.media_url = newMediaUrl;
    updates.media_type = req.cloudinaryUrl
      ? mediaTypeFromMimetype(req.file?.mimetype)
      : (VALID_MEDIA_TYPES.includes(mediaTypeOverride) ? mediaTypeOverride : mediaTypeFromUrl(newMediaUrl));
  }

  cache.clear();

  const updatedAd = await Advertisement.update(adId, updates);

  logger.info(`Advertisement updated: ${adId}`);

  res.status(200).json({
    success: true,
    message: 'Advertisement updated successfully',
    data: updatedAd,
  });
});

/**
 * @swagger
 * /api/ads/{id}:
 *   delete:
 *     summary: Delete advertisement
 *     tags: [Advertisements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Advertisement deleted
 *       404:
 *         description: Advertisement not found
 */
const deleteAd = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const adId = parseInt(id);
  if (isNaN(adId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid advertisement ID',
      statusCode: 400,
    });
  }

  const ad = await Advertisement.findById(adId);
  if (!ad) {
    return res.status(404).json({
      success: false,
      message: 'Advertisement not found',
      statusCode: 404,
    });
  }

  const publicId = getPublicIdFromUrl(ad.mediaUrl);
  if (publicId) {
    try {
      await deleteFromCloudinary(publicId, resourceTypeForMediaType(ad.mediaType));
      logger.info(`Deleted Cloudinary ad media: ${publicId}`);
    } catch (err) {
      logger.warn(`Failed to delete Cloudinary ad media: ${err.message}`);
    }
  }

  cache.clear();

  await Advertisement.delete(adId);

  logger.info(`Advertisement deleted: ${adId}`);

  res.status(200).json({
    success: true,
    message: 'Advertisement deleted successfully',
    data: { id: adId },
  });
});

/**
 * @swagger
 * /api/ads/{id}/reorder:
 *   patch:
 *     summary: Move an advertisement up or down in display order
 *     tags: [Advertisements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - direction
 *             properties:
 *               direction:
 *                 type: string
 *                 enum: [up, down]
 *     responses:
 *       200:
 *         description: Advertisements reordered
 */
const reorderAd = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { direction } = req.body;

  const adId = parseInt(id);
  if (isNaN(adId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid advertisement ID',
      statusCode: 400,
    });
  }

  const ads = await Advertisement.findAll({ activeOnly: false });
  const index = ads.findIndex((a) => a.id === adId);
  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: 'Advertisement not found',
      statusCode: 404,
    });
  }

  const neighborIndex = direction === 'up' ? index - 1 : index + 1;
  if (neighborIndex < 0 || neighborIndex >= ads.length) {
    // Already at the boundary - no-op
    return res.status(200).json({ success: true, message: 'No change', data: ads });
  }

  const current = ads[index];
  const neighbor = ads[neighborIndex];

  await Advertisement.update(current.id, { display_order: neighbor.displayOrder });
  await Advertisement.update(neighbor.id, { display_order: current.displayOrder });

  cache.clear();

  const updatedAds = await Advertisement.findAll({ activeOnly: false });

  res.status(200).json({
    success: true,
    message: 'Advertisement reordered',
    data: updatedAds,
  });
});

module.exports = {
  getAds,
  getAdminAds,
  createAd,
  updateAd,
  deleteAd,
  reorderAd,
};
