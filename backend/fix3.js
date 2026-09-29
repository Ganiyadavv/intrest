const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

const regex = /async function startServer\(\) \{[\s\S]*?startServer\(\);/;

const replacement = `async function startServer() {
  try {
    const { data, error } = await supabase.from('Users').select('*').limit(1);
    if (error && error.code !== '42P01') { 
      console.warn("Supabase connection warning:", error.message);
    } else {
      console.log("Supabase Database connected successfully.");
    }
  } catch (err) {
    console.warn("Supabase fetch failed. You might have a proxy, VPN, or Antivirus blocking the connection to Supabase on your machine.");
  }
  
  app.listen(PORT, () => {
    console.log(\`Server running on port \${PORT}\`);
  });
}

startServer();`;

code = code.replace(regex, replacement);
fs.writeFileSync('server.js', code);
