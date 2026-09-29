const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");

const dashboardRoutes = require("./routes/dashboardRoutes");
const personRecordRoutes = require("./routes/personRecordRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.json({
    message: "Interest Management Backend is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.use("/api/dashboard", dashboardRoutes);
app.use("/api/person-records", personRecordRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);

const PORT = process.env.PORT || 5000;
// const sequelize = require("./config/database");
// require("./models"); // Load all models and relationships

const sequelize = require("./config/database");
require("./models"); // Load all models and relationships

sequelize.sync({ alter: true })
  .then(() => {
    console.log("Database synchronized successfully.");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to sync database:", err);
  });



