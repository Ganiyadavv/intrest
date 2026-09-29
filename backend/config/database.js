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
    }
  },
  logging: false
});

module.exports = sequelize;
