const { User } = require('../models');

const ensureDefaultAdmin = async () => {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  // Never seed an account with a built-in password. If these are unset there
  // is nothing safe to create, so skip and let the operator provision the
  // admin explicitly.
  if (!username || !password) {
    console.warn(
      'ADMIN_USERNAME/ADMIN_PASSWORD not set - skipping default admin creation. ' +
        'Set both env vars (or create the admin via the Supabase SQL Editor) to enable admin login.'
    );
    return;
  }

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

