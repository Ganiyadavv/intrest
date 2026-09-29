const supabase = require('./config/supabase');

console.log("Starting Supabase connection test...");
supabase.testConnection().then((success) => {
  if (success) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});
