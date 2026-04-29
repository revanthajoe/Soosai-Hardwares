require('dotenv').config({ path: __dirname + '/../.env' });
const { pool } = require('../config/db');

async function run() {
  const client = await pool.connect();
  try {
    await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS nickname VARCHAR(200) DEFAULT '';`);
    console.log('Database schema updated: nickname column added');
  } catch (error) {
    console.error('Error updating database schema:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

run();
