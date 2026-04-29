const csrf = require('csurf');

const csrfProtection = csrf({
  cookie: {
    key: process.env.CSRF_COOKIE_NAME || 'csrf-token',
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  },
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
});

const csrfTokenHandler = (req, res) => {
  res.status(200).json({
    success: true,
    csrfToken: req.csrfToken(),
  });
};

module.exports = {
  csrfProtection,
  csrfTokenHandler,
};
