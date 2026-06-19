const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');

const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');

// Supabase client for data operations (optional)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client initialized.');
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err.message);
    supabase = null;
  }
} else {
  console.warn('SUPABASE_URL or SUPABASE_SERVICE_KEY not set; Supabase client disabled.');
}

// Raw pg pool for schema initialization and complex queries
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

const connectDB = async () => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('PostgreSQL (Supabase) connected successfully.');
  } catch (error) {
    console.error('PostgreSQL connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
module.exports.supabase = supabase;
module.exports.pool = pool;
