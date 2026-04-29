const express = require('express');
const { body, param, query } = require('express-validator');

const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const upload = require('../middlewares/uploadMiddleware');
const { uploadToCloud } = require('../middlewares/uploadMiddleware');
const { uploadLimiter } = require('../middlewares/rateLimitMiddleware');
const { protect } = require('../middlewares/authMiddleware');
const validateRequest = require('../utils/validateRequest');

const router = express.Router();

router.get(
  '/',
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100.'),
  query('category').optional().isInt({ min: 1 }).withMessage('Category must be a valid integer.'),
  query('featured').optional().isBoolean().withMessage('Featured must be a boolean.'),
  query('q').optional().isString().trim().isLength({ min: 1 }).withMessage('Query must be a string.'),
  validateRequest,
  getProducts
);

router.get(
  '/:id',
  param('id').isInt({ min: 1 }).withMessage('Invalid product id.'),
  validateRequest,
  getProductById
);

router.post(
  '/',
  protect,
  uploadLimiter,
  upload.single('image'),
  uploadToCloud,
  body('name').trim().notEmpty().withMessage('Product name is required.'),
  body('categoryId').isInt({ min: 1 }).withMessage('Valid category is required.'),
  body('price').trim().notEmpty().withMessage('Price range is required.'),
  validateRequest,
  createProduct
);

router.put(
  '/:id',
  protect,
  param('id').isInt({ min: 1 }).withMessage('Invalid product id.'),
  uploadLimiter,
  upload.single('image'),
  uploadToCloud,
  body('name').optional().trim().notEmpty().withMessage('Product name is required.'),
  body('categoryId').optional().isInt({ min: 1 }).withMessage('Valid category is required.'),
  body('price').optional().trim().notEmpty().withMessage('Price range cannot be empty.'),
  validateRequest,
  updateProduct
);

router.delete(
  '/:id',
  protect,
  param('id').isInt({ min: 1 }).withMessage('Invalid product id.'),
  validateRequest,
  deleteProduct
);

module.exports = router;
