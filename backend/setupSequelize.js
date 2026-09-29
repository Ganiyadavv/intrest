const fs = require('fs');

// 1. Revert server.js back to using Sequelize
let serverCode = fs.readFileSync('server.js', 'utf8');

// The replacement I used earlier in fix3.js was a big block for startServer(). I will remove it and put back the original Sequelize sync code.
const regexStartServer = /const supabase = require\("\.\/config\/supabase"\);[\s\S]*?startServer\(\);/;

const originalSequelizeCode = `const sequelize = require("./config/database");
require("./models"); // Load all models and relationships

sequelize.sync({ alter: true })
  .then(() => {
    console.log("Database synchronized successfully.");
    app.listen(PORT, () => {
      console.log(\`Server running on port \${PORT}\`);
    });
  })
  .catch((err) => {
    console.error("Failed to sync database:", err);
  });
`;

if (serverCode.match(regexStartServer)) {
  serverCode = serverCode.replace(regexStartServer, originalSequelizeCode);
  fs.writeFileSync('server.js', serverCode);
} else {
  console.log("Could not find startServer block to revert.");
}

// 2. Rewrite config/database.js to use postgres with a single Connection URI string
const databaseCode = `const { Sequelize } = require('sequelize');
require('dotenv').config();

if (!process.env.SUPABASE_DB_URL) {
  throw new Error("Missing SUPABASE_DB_URL in .env");
}

const sequelize = new Sequelize(process.env.SUPABASE_DB_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false // Required for Supabase connections
    }
  },
  logging: false
});

module.exports = sequelize;
`;
fs.writeFileSync('config/database.js', databaseCode);
console.log("Files updated for Sequelize Postgres");
