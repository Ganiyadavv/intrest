const express = require("express");
const router = express.Router();
const personalRecordController = require("../controllers/personalRecordController");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// All personal record operations require authentication
router.post(
  "/",
  authMiddleware,
  upload.single("paymentScreenshot"),
  personalRecordController.createPersonalRecord
);

router.get("/", authMiddleware, personalRecordController.getPersonalRecords);
router.get("/:id", authMiddleware, personalRecordController.getPersonalRecord);

router.put(
  "/:id",
  authMiddleware,
  upload.single("paymentScreenshot"),
  personalRecordController.updatePersonalRecord
);

router.delete("/:id", authMiddleware, personalRecordController.deletePersonalRecord);

// Repayment endpoints
router.post(
  "/:id/repayments",
  authMiddleware,
  upload.single("paymentScreenshot"),
  personalRecordController.addRepayment
);

router.delete(
  "/:id/repayments/:repaymentId",
  authMiddleware,
  personalRecordController.deleteRepayment
);

module.exports = router;
