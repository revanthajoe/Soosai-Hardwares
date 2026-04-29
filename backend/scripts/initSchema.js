const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const { initSchema } = require('../models');

const run = async () => {
  console.log('Connecting to database...');
  await connectDB();
  
  console.log('Initializing schema...');
  await initSchema();
  
  console.log('Schema initialization complete.');
  process.exit(0);
};

run().catch((error) => {
  console.error('Failed to initialize schema:', error.message);
  process.exit(1);
});
