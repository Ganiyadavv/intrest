const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();
if (!process.env.SUPABASE_DB_URL) {
  require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
}

if (!process.env.SUPABASE_DB_URL) {
  throw new Error("Missing SUPABASE_DB_URL in .env");
}

const sequelize = new Sequelize(process.env.SUPABASE_DB_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false // Required for Supabase connections
    },
    keepAlive: true,
    statement_timeout: 15000 // 15s query timeout prevents hanging queries
  },
  pool: {
    max: 10,
    min: 0,           // min: 0 prevents stale sockets dropped by Supabase PgBouncer
    acquire: 15000,
    idle: 20000,      // release idle connections quickly before serverless pooler drops them
    evict: 5000       // evict dead/stale connections every 5s
  },
  logging: false
});

module.exports = sequelize;

