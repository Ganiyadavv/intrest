const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

const target = `app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});`;

const replacement = `const supabase = require("./config/supabase");

async function startServer() {
  const { data, error } = await supabase.from('Users').select('*').limit(1);
  if (error && error.code !== '42P01') { 
    console.error("Supabase connection error:", error.message);
  } else {
    console.log("Supabase Database connected successfully.");
  }
  app.listen(PORT, () => {
    console.log(\`Server running on port \${PORT}\`);
  });
}

startServer();`;

code = code.replace(target, replacement);
fs.writeFileSync('server.js', code);
