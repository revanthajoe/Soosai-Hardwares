const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const generateToken = require('../utils/generateToken');

const loginAdmin = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ where: { username, role: 'admin' } });

  if (!user) {
    res.status(401);
    throw new Error('Invalid username or password.');
  }

  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    res.status(401);
    throw new Error('Invalid username or password.');
  }

  const token = generateToken({ id: user.id, role: user.role });

  res.status(200).json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    },
  });
});

module.exports = {
  loginAdmin,
};
