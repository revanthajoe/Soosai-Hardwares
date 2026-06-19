const { createClient } = require('@supabase/supabase-js');

// Supabase client for data operations (HTTPS REST API — works on free tier without IPv4)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Track connection state
let isConnected = false;

/**
 * Verify Supabase connectivity via the REST API.
 * Supabase free tier does not provide IPv4 for direct PostgreSQL connections,
 * so we use the JS client (HTTPS) for all database operations.
 */
const connectDB = async (retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Test connectivity using the Supabase REST API
      const { error } = await supabase.from('analytics').select('id').limit(1);
      if (error) throw error;
      isConnected = true;
      console.log('Supabase connected successfully (via REST API).');
      return;
    } catch (error) {
      console.error(`Supabase connection attempt ${attempt}/${retries} failed:`, error.message);
      if (attempt < retries) {
        console.log(`Retrying in ${attempt * 2} seconds...`);
        await new Promise((r) => setTimeout(r, attempt * 2000));
      }
    }
  }
  console.error('All Supabase connection attempts failed. Server will start without DB.');
  isConnected = false;
};

module.exports = connectDB;
module.exports.supabase = supabase;
module.exports.isConnected = () => isConnected;
