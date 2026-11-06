const express = require("express");
const router = express.Router();
const requestController = require("../controllers/requestController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/incoming", authMiddleware, requestController.getIncomingRequests);
router.get("/sent", authMiddleware, requestController.getSentRequests);
router.get("/:recordType/:recordId", authMiddleware, requestController.getRequestDetails);
router.put("/:recordType/:recordId/accept", authMiddleware, requestController.acceptRequest);
router.put("/:recordType/:recordId/reject", authMiddleware, requestController.rejectRequest);
router.put("/:recordType/:recordId/complete", authMiddleware, requestController.completeRequest);

module.exports = router;

