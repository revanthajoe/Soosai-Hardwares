const express = require('express');
const { getReviewsByProductId, createReview, deleteReview, getShopReviews, createShopReview } = require('../controllers/reviewController');
const { protect } = require('../middlewares/authMiddleware');
const validateRequest = require('../utils/validateRequest');
const { param, body } = require('express-validator');

const router = express.Router();

router.get('/shop', getShopReviews);

router.post(
  '/shop',
  body('authorName').trim().notEmpty().withMessage('Name is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  validateRequest,
  createShopReview
);

router.get(
  '/:productId',
  param('productId').isInt({ min: 1 }).withMessage('Invalid product id'),
  validateRequest,
  getReviewsByProductId
);

router.post(
  '/:productId',
  param('productId').isInt({ min: 1 }).withMessage('Invalid product id'),
  body('authorName').trim().notEmpty().withMessage('Name is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  validateRequest,
  createReview
);

router.delete(
  '/:id',
  protect,
  param('id').isInt({ min: 1 }).withMessage('Invalid review id'),
  validateRequest,
  deleteReview
);

module.exports = router;
