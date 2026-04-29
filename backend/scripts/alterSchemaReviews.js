require('dotenv').config({ path: __dirname + '/../.env' });
const { pool } = require('../config/db');

async function run() {
  const client = await pool.connect();
  try {
    await client.query(`ALTER TABLE reviews ALTER COLUMN product_id DROP NOT NULL;`);
    console.log('Database schema updated: reviews.product_id is now nullable');
  } catch (error) {
    console.error('Error updating database schema:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

run();
