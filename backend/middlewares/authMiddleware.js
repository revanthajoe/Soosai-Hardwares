const jwt = require('jsonwebtoken');
const { User } = require('../models');
const asyncHandler = require('../utils/asyncHandler');

// Sentinel id used by the env-credential login path in authController, which
// issues a token without a backing users row. Kept in sync with that file.
const ENV_ADMIN_ID = 1;

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

    let user = null;
    try {
      user = await User.findById(decoded.id);
    } catch (dbError) {
      // A failed lookup means we cannot verify the caller, which is not the
      // same as verifying them successfully. Surface it as a 503 rather than
      // silently falling through to trusting the token payload.
      res.status(503);
      throw new Error(`Unable to verify credentials right now: ${dbError.message}`);
    }

    if (user) {
      if (user.role !== 'admin') {
        res.status(403);
        throw new Error('Forbidden: admin access required.');
      }
      req.user = user;
    } else if (decoded.id === ENV_ADMIN_ID && decoded.role === 'admin' && process.env.ADMIN_USERNAME) {
      // Env-credential login (authController) mints a token for a sentinel id
      // that has no corresponding users row. Accept only that exact id, and
      // only while env-credential login is actually configured — never trust
      // an arbitrary token that merely claims role=admin.
      req.user = {
        id: decoded.id,
        username: process.env.ADMIN_USERNAME,
        role: 'admin',
      };
    } else {
      res.status(403);
      throw new Error('Forbidden: admin access required.');
    }

    next();
  } catch (error) {
    // Preserve deliberate status codes set above; only genuine JWT failures
    // should be rewritten to a generic 401.
    if (res.statusCode === 403 || res.statusCode === 503) {
      throw error;
    }
    res.status(401);
    throw new Error('Unauthorized: invalid or expired token.');
  }
});

module.exports = {
  protect,
};

