require('dotenv').config({ path: __dirname + '/../.env' });
const { pool } = require('../config/db');

async function run() {
  const client = await pool.connect();
  try {
    await client.query(`ALTER TABLE products DROP COLUMN IF EXISTS stock;`);
    await client.query(`ALTER TABLE products ALTER COLUMN price TYPE VARCHAR(100);`);
    await client.query(`ALTER TABLE products ALTER COLUMN price SET DEFAULT 'Contact for price';`);
    console.log('Database schema updated successfully');
  } catch (error) {
    console.error('Error updating database schema:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

run();
