const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", authMiddleware, notificationController.getMyNotifications);
router.get("/:notificationId", authMiddleware, notificationController.getNotificationPersonDetails);

module.exports = router;
