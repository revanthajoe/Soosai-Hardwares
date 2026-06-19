const jwt = require('jsonwebtoken');
const { User } = require('../models');
const asyncHandler = require('../utils/asyncHandler');

const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401);
    throw new Error('Unauthorized: token missing.');
  }

  const token = authHeader.split(' ')[1];

  if (!process.env.JWT_SECRET) {
    res.status(500);
    throw new Error('JWT_SECRET is missing in environment configuration.');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Try to find user in DB first
    let user = null;
    try {
      user = await User.findById(decoded.id);
    } catch {
      // DB lookup may fail due to RLS — fall through to token-based auth
    }

    if (user) {
      if (user.role !== 'admin') {
        res.status(403);
        throw new Error('Forbidden: admin access required.');
      }
      req.user = user;
    } else if (decoded.role === 'admin') {
      // Fallback: trust the JWT payload (ENV-based login)
      req.user = {
        id: decoded.id,
        username: process.env.ADMIN_USERNAME || 'admin',
        role: 'admin',
      };
    } else {
      res.status(403);
      throw new Error('Forbidden: admin access required.');
    }

    next();
  } catch (error) {
    if (res.statusCode === 403) {
      throw error;
    }
    res.status(401);
    throw new Error('Unauthorized: invalid or expired token.');
  }
});

module.exports = {
  protect,
};

