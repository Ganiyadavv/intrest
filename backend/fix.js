const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

code = code.replace('const sequelize = require("./config/database");', '// const sequelize = require("./config/database");');
code = code.replace('require("./models"); // Load all models and relationships', '// require("./models"); // Load all models and relationships');

const regex = /sequelize\.sync\(\{ alter: true \}\)[\s\S]*?\.catch\(\(err\) => \{\s*console\.error\("Failed to sync database:", err\);\s*\}\);/;

code = code.replace(regex, `app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});`);

fs.writeFileSync('server.js', code);
console.log('Fixed server.js');
