const User = require('../models/User');

const ensureDefaultAdmin = async () => {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';

  const existing = await User.findOne({ where: { username, role: 'admin' } });

  if (existing) {
    return;
  }

  await User.create({
    username,
    password,
    role: 'admin',
  });

  console.log(`Default admin user created: ${username}`);
};

module.exports = ensureDefaultAdmin;
