const express = require("express");
const router = express.Router();
const lenderRecordController = require("../controllers/lenderRecordController");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

router.post("/", authMiddleware, upload.single('paymentScreenshot'), lenderRecordController.createLenderRecord);
router.get("/", authMiddleware, lenderRecordController.getLenderRecords);
router.get("/:id", authMiddleware, lenderRecordController.getLenderRecordById);
router.put("/:id", authMiddleware, upload.single('paymentScreenshot'), lenderRecordController.updateLenderRecord);
router.delete("/:id", authMiddleware, lenderRecordController.deleteLenderRecord);
router.put("/:id/accept", authMiddleware, lenderRecordController.acceptLenderRecord);
router.put("/:id/reject", authMiddleware, lenderRecordController.rejectLenderRecord);
router.put("/:id/complete", authMiddleware, lenderRecordController.completeLenderRecord);

module.exports = router;
