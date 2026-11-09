const { Sequelize } = require('sequelize');
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
    },
    keepAlive: true
  },
  pool: {
    max: 10,
    min: 2,           // Keep at least 2 connections alive so queries don't wait for TLS handshakes
    acquire: 30000,
    idle: 300000      // Keep idle connection open for 5 minutes instead of 10 seconds
  },
  logging: false
});

module.exports = sequelize;

