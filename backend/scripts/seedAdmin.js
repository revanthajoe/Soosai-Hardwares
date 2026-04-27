const dotenv = require('dotenv');
const connectDB = require('../config/db');
const ensureDefaultAdmin = require('../utils/ensureDefaultAdmin');

dotenv.config();

const run = async () => {
  await connectDB();
  await ensureDefaultAdmin();
  process.exit(0);
};

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
