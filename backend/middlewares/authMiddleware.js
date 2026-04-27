const jwt = require('jsonwebtoken');
const User = require('../models/User');
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
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] },
    });

    if (!user || user.role !== 'admin') {
      res.status(403);
      throw new Error('Forbidden: admin access required.');
    }

    req.user = user;
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
