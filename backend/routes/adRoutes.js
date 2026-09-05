const express = require('express');
const { body, param } = require('express-validator');

const {
  getAds,
  getAdminAds,
  createAd,
  updateAd,
  deleteAd,
  reorderAd,
} = require('../controllers/adController');
const { uploadAdMedia, uploadAdToCloud } = require('../middlewares/uploadMiddleware');
const { uploadLimiter } = require('../middlewares/rateLimitMiddleware');
const { protect } = require('../middlewares/authMiddleware');
const validateRequest = require('../utils/validateRequest');

const router = express.Router();

router.get('/', getAds);

router.get('/admin', protect, getAdminAds);

router.post(
  '/',
  protect,
  uploadLimiter,
  uploadAdMedia.single('media'),
  uploadAdToCloud,
  body('title').optional().trim(),
  body('linkUrl').optional().trim(),
  validateRequest,
  createAd
);

router.put(
  '/:id',
  protect,
  param('id').isInt({ min: 1 }).withMessage('Invalid advertisement id.'),
  uploadLimiter,
  uploadAdMedia.single('media'),
  uploadAdToCloud,
  body('title').optional().trim(),
  body('linkUrl').optional().trim(),
  validateRequest,
  updateAd
);

router.patch(
  '/:id/reorder',
  protect,
  param('id').isInt({ min: 1 }).withMessage('Invalid advertisement id.'),
  body('direction').isIn(['up', 'down']).withMessage('Direction must be up or down.'),
  validateRequest,
  reorderAd
);

router.delete(
  '/:id',
  protect,
  param('id').isInt({ min: 1 }).withMessage('Invalid advertisement id.'),
  validateRequest,
  deleteAd
);

module.exports = router;
