/**
 * Auth Controller
 * Handles authentication and authorization
 */

const { User } = require('../models');
const { logger } = require('../config/logger');
const asyncHandler = require('../utils/asyncHandler');
const generateToken = require('../utils/generateToken');
const { validate } = require('../middlewares/validationMiddleware');

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Admin login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: admin
 *               password:
 *                 type: string
 *                 format: password
 *                 example: admin123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                     user:
 *                       type: object
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
const loginAdmin = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  logger.debug(`Login attempt for user: ${username}`);

  // Validate input
  if (!username || !password) {
    logger.warn(`Login attempt with missing credentials`);
    return res.status(400).json({
      success: false,
      message: 'Username and password are required',
      statusCode: 400,
    });
  }

  // Find admin user
  const user = await User.findOne({
    where: { username, role: 'admin' },
  });

  if (!user) {
    logger.warn(`Login failed: user not found - ${username}`);
    return res.status(401).json({
      success: false,
      message: 'Invalid username or password',
      statusCode: 401,
    });
  }

  // Check password
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    logger.warn(`Login failed: incorrect password - ${username}`);
    return res.status(401).json({
      success: false,
      message: 'Invalid username or password',
      statusCode: 401,
    });
  }

  // Generate token
  const token = generateToken({ id: user.id, role: user.role });

  logger.info(`Successful login: ${username}`);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
      },
    },
  });
});

/**
 * @swagger
 * /api/auth/verify:
 *   get:
 *     summary: Verify JWT token
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
const verifyToken = asyncHandler(async (req, res) => {
  // If we reach here, token is valid (checked by auth middleware)
  res.status(200).json({
    success: true,
    message: 'Token is valid',
    user: req.user,
  });
});

module.exports = {
  loginAdmin,
  verifyToken,
};
