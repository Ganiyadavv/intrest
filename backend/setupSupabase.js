const fs = require('fs');
require('dotenv').config();

// 1. Update .env
let envCode = fs.readFileSync('.env', 'utf8');
envCode = envCode.replace(/SUPABASE_SERVICE_ROLE_KEY=.*\n?/g, '');
// Add backend specific variables if they don't exist
if (!envCode.includes('SUPABASE_SECRET_KEY')) {
  envCode += `\nSUPABASE_URL=https://oxyyoliksmpsgvewstvs.supabase.co\nSUPABASE_SECRET_KEY=your_supabase_secret_key_here\n`;
}
fs.writeFileSync('.env', envCode);

// 2. Rewrite config/supabase.js
const supabaseConfig = `const { createClient } = require('@supabase/supabase-js');
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
`;
fs.writeFileSync('config/supabase.js', supabaseConfig);

// 3. Create test script test-supabase.js
const testScript = `const supabase = require('./config/supabase');

console.log("Starting Supabase connection test...");
supabase.testConnection().then((success) => {
  if (success) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});
`;
fs.writeFileSync('test-supabase.js', testScript);
console.log('Files updated successfully.');
