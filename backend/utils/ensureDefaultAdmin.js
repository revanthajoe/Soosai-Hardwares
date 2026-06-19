const { User } = require('../models');

const ensureDefaultAdmin = async () => {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'Revanth2006';

  try {
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
  } catch (err) {
    // RLS may block this with a publishable key — admin likely already exists
    console.warn(`Admin setup skipped: ${err.message}`);
    console.warn('If admin login fails, use the Supabase service_role key or create the admin via SQL Editor.');
  }
};

module.exports = ensureDefaultAdmin;

