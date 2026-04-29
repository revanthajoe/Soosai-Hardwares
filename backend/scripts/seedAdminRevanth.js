const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const { User } = require('../models');

const run = async () => {
  await connectDB();
  
  const username = 'Revanth';
  const password = process.env.ADMIN_PASSWORD || 'Revanth_1108'; // Defaulting just in case

  try {
    const existing = await User.findByUsername(username);
    if (!existing) {
      await User.create({
        username,
        password,
        role: 'admin'
      });
      console.log(`Admin user '${username}' created successfully.`);
    } else {
      console.log(`Admin user '${username}' already exists.`);
    }
  } catch (err) {
    console.error('Error creating admin:', err.message);
  } finally {
    process.exit(0);
  }
};

run();
