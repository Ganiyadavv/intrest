const lenderRecordService = require("../services/lenderRecordService");

const sendResponse = (res, statusCode, status, message, data = null) => {
  const response = { statusCode, status, message };
  if (data) response.data = data;
  return res.status(statusCode).json(response);
};

exports.createLenderRecord = async (req, res) => {
  try {
    const ownerId = req.user.id; // Changed from req.user.userId to req.user.id because ownerId maps to database id. Wait, the existing personRecordController used req.user.userId (which is the database id, maybe?). Let me check what authMiddleware sets. I'll use req.user.id or req.user.userId based on how it's handled. Actually PersonRecordController had `const ownerId = req.user.userId;`. Let's stick to `req.user.userId` as that seems to be how the DB ID is stored in the JWT here.
    
    const ownerIdForDb = req.user.userId; 

    let paymentScreenshot = undefined;
    if (req.file) {
      paymentScreenshot = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    } else if (req.body.paymentScreenshot) {
      paymentScreenshot = req.body.paymentScreenshot;
    }

    const data = { ...req.body };
    if (paymentScreenshot !== undefined) {
      data.paymentScreenshot = paymentScreenshot;
    }

    const record = await lenderRecordService.createLenderRecord(ownerIdForDb, data);
    return sendResponse(res, 201, "SUCCESS", "Lender record created successfully", record);
  } catch (error) {
    if (error.message === "User ID format is invalid" || error.message === "Target user not found") {
       return sendResponse(res, 400, "ERROR", error.message);
    }
    console.error("Error creating lender record:", error);
    return sendResponse(res, 500, "ERROR", "Internal server error");
  }
};

exports.getLenderRecords = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const records = await lenderRecordService.getLenderRecords(ownerId);
    return sendResponse(res, 200, "SUCCESS", "Lender records fetched successfully", records);
  } catch (error) {
    console.error("Error fetching lender records:", error);
    return sendResponse(res, 500, "ERROR", "Internal server error");
  }
};

exports.getLenderRecordById = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const recordId = req.params.id;
    const record = await lenderRecordService.getLenderRecordById(ownerId, recordId);
    return sendResponse(res, 200, "SUCCESS", "Lender record fetched successfully", record);
  } catch (error) {
    if (error.message === "Lender record not found") {
      return sendResponse(res, 404, "ERROR", error.message);
    }
    if (error.message === "You do not have permission to access this record") {
      return sendResponse(res, 403, "ERROR", error.message);
    }
    console.error("Error fetching lender record:", error);
    return sendResponse(res, 500, "ERROR", "Internal server error");
  }
};

exports.updateLenderRecord = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const recordId = req.params.id;

    let paymentScreenshot = undefined;
    if (req.file) {
      paymentScreenshot = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    } else if (req.body.paymentScreenshot !== undefined) {
      paymentScreenshot = req.body.paymentScreenshot;
    }

    const data = { ...req.body };
    if (paymentScreenshot !== undefined) {
      data.paymentScreenshot = paymentScreenshot;
    }

    const record = await lenderRecordService.updateLenderRecord(ownerId, recordId, data);
    return sendResponse(res, 200, "SUCCESS", "Lender record updated successfully", record);
  } catch (error) {
    if (error.message === "Lender record not found") {
      return sendResponse(res, 404, "ERROR", error.message);
    }
    if (error.message === "You can only edit your own records") {
      return sendResponse(res, 403, "ERROR", error.message);
    }
    console.error("Error updating lender record:", error);
    return sendResponse(res, 500, "ERROR", "Internal server error");
  }
};

exports.deleteLenderRecord = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const recordId = req.params.id;
    await lenderRecordService.deleteLenderRecord(ownerId, recordId);
    return sendResponse(res, 200, "SUCCESS", "Lender record deleted successfully");
  } catch (error) {
    if (error.message === "Lender record not found") {
      return sendResponse(res, 404, "ERROR", error.message);
    }
    if (error.message === "You can only delete your own records") {
      return sendResponse(res, 403, "ERROR", error.message);
    }
    console.error("Error deleting lender record:", error);
    return sendResponse(res, 500, "ERROR", "Internal server error");
  }
};

exports.acceptLenderRecord = async (req, res) => {
  try {
    const userId = req.user.userId;
    const recordId = req.params.id;
    await lenderRecordService.acceptLenderRecord(userId, recordId);
    return sendResponse(res, 200, "SUCCESS", "Lender record accepted successfully");
  } catch (error) {
    if (error.message === "Lender record not found") {
      return sendResponse(res, 404, "ERROR", error.message);
    }
    if (error.message.includes("Only the target user")) {
      return sendResponse(res, 403, "ERROR", error.message);
    }
    if (error.message.includes("Only pending records")) {
      return sendResponse(res, 400, "ERROR", error.message);
    }
    console.error("Error accepting lender record:", error);
    return sendResponse(res, 500, "ERROR", "Internal server error");
  }
};

exports.rejectLenderRecord = async (req, res) => {
  try {
    const userId = req.user.userId;
    const recordId = req.params.id;
    await lenderRecordService.rejectLenderRecord(userId, recordId);
    return sendResponse(res, 200, "SUCCESS", "Lender record rejected successfully");
  } catch (error) {
    if (error.message === "Lender record not found") {
      return sendResponse(res, 404, "ERROR", error.message);
    }
    if (error.message.includes("Only the target user")) {
      return sendResponse(res, 403, "ERROR", error.message);
    }
    if (error.message.includes("Only pending records")) {
      return sendResponse(res, 400, "ERROR", error.message);
    }
    console.error("Error rejecting lender record:", error);
    return sendResponse(res, 500, "ERROR", "Internal server error");
  }
};

exports.completeLenderRecord = async (req, res) => {
  try {
    const userId = req.user.userId;
    const recordId = req.params.id;
    await lenderRecordService.completeLenderRecord(userId, recordId);
    return sendResponse(res, 200, "SUCCESS", "Lender record marked as completed");
  } catch (error) {
    if (error.message === "Lender record not found") {
      return sendResponse(res, 404, "ERROR", error.message);
    }
    if (error.message.includes("Only the owner")) {
      return sendResponse(res, 403, "ERROR", error.message);
    }
    console.error("Error completing lender record:", error);
    return sendResponse(res, 500, "ERROR", "Internal server error");
  }
};
