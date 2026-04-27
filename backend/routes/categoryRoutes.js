const express = require('express');
const { body, param } = require('express-validator');

const {
  getCategories,
  createCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { protect } = require('../middlewares/authMiddleware');
const validateRequest = require('../utils/validateRequest');

const router = express.Router();

router.get('/', getCategories);

router.post(
  '/',
  protect,
  body('name').trim().notEmpty().withMessage('Category name is required.'),
  validateRequest,
  createCategory
);

router.delete(
  '/:id',
  protect,
  param('id').isInt({ min: 1 }).withMessage('Invalid category id.'),
  validateRequest,
  deleteCategory
);

module.exports = router;
