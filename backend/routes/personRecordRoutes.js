const express = require("express");
const router = express.Router();
const personRecordController = require("../controllers/personRecordController");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

router.post("/", authMiddleware, upload.single('paymentScreenshot'), personRecordController.createPersonRecord);
router.get("/", authMiddleware, personRecordController.getPersonRecords);
router.get("/:id", authMiddleware, personRecordController.getPersonRecord);
router.put("/:id", authMiddleware, upload.single('paymentScreenshot'), personRecordController.updatePersonRecord);
router.delete("/:id", authMiddleware, personRecordController.deletePersonRecord);
router.put("/:id/accept", authMiddleware, personRecordController.acceptPersonRecord);
router.put("/:id/reject", authMiddleware, personRecordController.rejectPersonRecord);
router.put("/:id/complete", authMiddleware, personRecordController.completePersonRecord);

module.exports = router;
