require('dotenv').config();
const sequelize = require('./config/database');
require('./models'); // Load all models and associations

const syncDb = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log("Database synchronized successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error synchronizing database:", error);
    process.exit(1);
  }
};

syncDb();
