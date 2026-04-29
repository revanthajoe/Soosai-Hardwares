const { User } = require('../models');

const ensureDefaultAdmin = async () => {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';

  const existing = await User.findByUsername(username);

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
