const express = require('express');
const { body, param } = require('express-validator');

const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const upload = require('../middlewares/uploadMiddleware');
const { protect } = require('../middlewares/authMiddleware');
const validateRequest = require('../utils/validateRequest');

const router = express.Router();

router.get('/', getProducts);

router.get(
  '/:id',
  param('id').isInt({ min: 1 }).withMessage('Invalid product id.'),
  validateRequest,
  getProductById
);

router.post(
  '/',
  protect,
  upload.single('image'),
  body('name').trim().notEmpty().withMessage('Product name is required.'),
  body('category').isInt({ min: 1 }).withMessage('Valid category is required.'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a non-negative number.'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer.'),
  validateRequest,
  createProduct
);

router.put(
  '/:id',
  protect,
  param('id').isInt({ min: 1 }).withMessage('Invalid product id.'),
  upload.single('image'),
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
