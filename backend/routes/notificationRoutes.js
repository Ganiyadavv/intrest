const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", authMiddleware, notificationController.getMyNotifications);
router.get("/:notificationId", authMiddleware, notificationController.getNotificationPersonDetails);
router.put("/:notificationId/read", authMiddleware, notificationController.markAsRead);
router.delete("/:notificationId", authMiddleware, notificationController.deleteNotification);

module.exports = router;
