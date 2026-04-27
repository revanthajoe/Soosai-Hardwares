const express = require('express');
const { body } = require('express-validator');

const { loginAdmin } = require('../controllers/authController');
const validateRequest = require('../utils/validateRequest');

const router = express.Router();

router.post(
  '/login',
  body('username').trim().notEmpty().withMessage('Username is required.'),
  body('password').trim().notEmpty().withMessage('Password is required.'),
  validateRequest,
  loginAdmin
);

module.exports = router;
