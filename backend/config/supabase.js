const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl) {
  throw new Error("Missing SUPABASE_URL in .env");
}

if (!supabaseSecretKey) {
  throw new Error("Missing SUPABASE_SECRET_KEY in .env");
}

// Create the client with the secret key for admin privileges on the backend
const supabase = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// A simple connection test function
supabase.testConnection = async () => {
  try {
    // Perform a lightweight request to verify connection
    const { error } = await supabase.from('Users').select('*').limit(1);
    if (error && error.code !== '42P01') { 
      // 42P01 means table doesn't exist, which still proves connection is successful
      throw error;
    }
    console.log('✅ Supabase connected successfully.');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:');
    if (error.cause && error.cause.code === 'ECONNRESET') {
      console.error('Network Error: The connection was forcibly closed (ECONNRESET). This is usually caused by an antivirus, firewall, or proxy blocking the request to Supabase.');
    } else {
      console.error(error.message || error);
    }
    return false;
  }
};

module.exports = supabase;
