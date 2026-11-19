const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();
if (!process.env.SUPABASE_DB_URL && !process.env.PORT) {
  dotenv.config({ path: path.resolve(__dirname, ".env") });
}

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");

const dashboardRoutes = require("./routes/dashboardRoutes");
const personRecordRoutes = require("./routes/personRecordRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const lenderRecordRoutes = require("./routes/lenderRecordRoutes");
const personalRecordRoutes = require("./routes/personalRecordRoutes");
const requestRoutes = require("./routes/requestRoutes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Fast health endpoints for cloud warm-up and uptime monitors (responds in < 1ms)
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: Date.now() });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: Date.now() });
});

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
app.use("/api/lender-records", lenderRecordRoutes);
app.use("/api/personal-records", personalRecordRoutes);
app.use("/api/requests", requestRoutes);

// Global error handling middleware (handles PayloadTooLarge 413 cleanly in JSON)
app.use((err, req, res, next) => {
  if (err.type === "entity.too.large" || err.status === 413) {
    return res.status(413).json({
      statusCode: 413,
      status: "ERROR",
      message: "The uploaded image is too large. Please select a smaller photo.",
    });
  }
  console.error("Unhandled server error:", err);
  return res.status(err.status || 500).json({
    statusCode: err.status || 500,
    status: "ERROR",
    message: err.message || "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;

const sequelize = require("./config/database");
require("./models"); // Load all models and relationships

// Start listening immediately so cloud host (Render) and health checks bind in milliseconds
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Self-ping to prevent Render free-tier spin-down (inactivity threshold is 15 minutes)
const KEEP_ALIVE_URL = process.env.RENDER_EXTERNAL_URL || "https://intrest.onrender.com";
const PING_INTERVAL = 9 * 60 * 1000; // 9 minutes

const pingKeepAlive = () => {
  try {
    const https = require("https");
    const http = require("http");
    const client = KEEP_ALIVE_URL.startsWith("https") ? https : http;
    client.get(`${KEEP_ALIVE_URL}/health`, (res) => {
      res.resume(); // consume response data to free memory
    }).on("error", () => {
      // ignore network errors silently
    });
  } catch (_) {}
};

setInterval(pingKeepAlive, PING_INTERVAL);
setTimeout(pingKeepAlive, 15000); // initial ping 15s after startup

// Keep Supabase connection pool alive and prevent PgBouncer idle socket disconnect
setInterval(async () => {
  try {
    await sequelize.query('SELECT 1;');
  } catch (_) {}
}, 4 * 60 * 1000); // every 4 minutes

// Authenticate and connect database in background
sequelize.authenticate()
  .then(async () => {
    console.log("Database connected successfully.");
    try {
      const { PersonalRecord, PersonalRecordRepayment, PersonRecordRepayment } = require("./models");
      await PersonalRecord.sync();
      await PersonalRecordRepayment.sync();
      await PersonRecordRepayment.sync();
    } catch (syncErr) {
      console.warn("Background records sync notice:", syncErr.message);
    }
    // In local non-production development, sync models in background
    if (process.env.NODE_ENV !== "production") {
      sequelize.sync().catch((err) => {
        console.warn("Background sequelize.sync note:", err.message);
      });
    }
  })
  .catch((err) => {
    console.error("Failed to connect database:", err);
  });



