const { PersonRecord, User, Notification } = require("../models");

// Helper to format responses
const sendResponse = (res, statusCode, status, message, data = null) => {
  const response = { statusCode, status, message };
  if (data) response.data = data;
  return res.status(statusCode).json(response);
};

exports.createPersonRecord = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    let { userId, name, fatherName, phoneNumber, village, mandal, pincode, district, state, country, amount, interestRate, givenDate, notes } = req.body;
    let paymentScreenshot = null;
    if (req.file) {
      paymentScreenshot = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    } else if (req.body.paymentScreenshot) {
      paymentScreenshot = req.body.paymentScreenshot;
    }

    let targetUserId = null;

    if (userId) {
      userId = userId.trim().toUpperCase();
      const userIdRegex = /^USR-[A-Z0-9]{8}$/;
      if (!userIdRegex.test(userId)) {
        return sendResponse(res, 400, "ERROR", "User ID format is invalid");
      }

      const targetUser = await User.findOne({ where: { userId } });
      if (!targetUser) {
        return sendResponse(res, 404, "ERROR", "Target user not found");
      }
      targetUserId = targetUser.id;
    }

    const personRecord = await PersonRecord.create({
      ownerId,
      targetUserId,
      name,
      fatherName,
      phoneNumber,
      village,
      mandal,
      pincode,
      district,
      state,
      country,
      amount,
      interestRate,
      givenDate,
      paymentScreenshot,
      notes,
      status: "PENDING"
    });

    if (targetUserId) {
      await Notification.create({
        recipientId: targetUserId,
        senderId: ownerId,
        personRecordId: personRecord.id,
        type: "PERSON_RECORD_REQUEST",
        title: "Payment Request from Lender",
        message: "User A has sent you a payment request with the amount and interest details. Please review the payment details and accept or reject the request."
      });
    }



    return sendResponse(res, 201, "SUCCESS", "Person record created successfully", personRecord);
  } catch (error) {
    console.error("Error creating person record:", error);
    return sendResponse(res, 500, "ERROR", "Internal server error");
  }
};

exports.getPersonRecords = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const records = await PersonRecord.findAll({
      where: { ownerId },
      include: [
        { model: User, as: 'targetUser', attributes: ['userId', 'fullName'] }
      ]
    });

    const formattedRecords = records.map(record => {
      const data = record.toJSON();
      if (data.targetUser && data.targetUser.userId) {
        data.targetUserId = data.targetUser.userId;
      }
      return data;
    });

    return sendResponse(res, 200, "SUCCESS", "Person records fetched successfully", formattedRecords);
  } catch (error) {
    console.error("Error fetching person records:", error);
    return sendResponse(res, 500, "ERROR", "Internal server error");
  }
};

exports.getPersonRecord = async (req, res) => {
  try {
    const userId = req.user.userId;
    const recordId = req.params.id;

    const record = await PersonRecord.findByPk(recordId, {
      include: [
        { model: User, as: 'targetUser', attributes: ['userId', 'fullName'] }
      ]
    });

    if (!record) {
      return sendResponse(res, 404, "ERROR", "Person record not found");
    }

    if (record.ownerId !== userId && record.targetUserId !== userId) {
      return sendResponse(res, 403, "ERROR", "You do not have permission to access this record");
    }

    const formattedRecord = record.toJSON();
    if (formattedRecord.targetUser && formattedRecord.targetUser.userId) {
      formattedRecord.targetUserId = formattedRecord.targetUser.userId;
    }

    return sendResponse(res, 200, "SUCCESS", "Person record fetched successfully", formattedRecord);
  } catch (error) {
    console.error("Error fetching person record:", error);
    return sendResponse(res, 500, "ERROR", "Internal server error");
  }
};

exports.updatePersonRecord = async (req, res) => {
  try {
    const userId = req.user.userId;
    const recordId = req.params.id;

    // Do not destructure ownerId, targetUserId, status to prevent updating them
    const { name, fatherName, phoneNumber, village, mandal, pincode, district, state, country, amount, interestRate, givenDate, notes } = req.body;
    let paymentScreenshot = undefined;
    if (req.file) {
      paymentScreenshot = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    } else if (req.body.paymentScreenshot) {
      paymentScreenshot = req.body.paymentScreenshot;
    }

    const record = await PersonRecord.findByPk(recordId);

    if (!record) {
      return sendResponse(res, 404, "ERROR", "Person record not found");
    }

    if (record.ownerId !== userId) {
      return sendResponse(res, 403, "ERROR", "You can only edit your own records");
    }

    const updateData = { name, fatherName, phoneNumber, village, mandal, pincode, district, state, country, amount, interestRate, givenDate, notes };
    if (paymentScreenshot !== undefined) {
      updateData.paymentScreenshot = paymentScreenshot;
    }

    await record.update(updateData);

    return sendResponse(res, 200, "SUCCESS", "Person record updated successfully", record);
  } catch (error) {
    console.error("Error updating person record:", error);
    return sendResponse(res, 500, "ERROR", "Internal server error");
  }
};

exports.deletePersonRecord = async (req, res) => {
  try {
    const userId = req.user.userId;
    const recordId = req.params.id;

    const record = await PersonRecord.findByPk(recordId);

    if (!record) {
      return sendResponse(res, 404, "ERROR", "Person record not found");
    }

    if (record.ownerId !== userId) {
      return sendResponse(res, 403, "ERROR", "You can only delete your own records");
    }

    // Delete related notifications
    await Notification.destroy({ where: { personRecordId: recordId } });

    await record.destroy();

    return sendResponse(res, 200, "SUCCESS", "Person record deleted successfully");
  } catch (error) {
    console.error("Error deleting person record:", error);
    return sendResponse(res, 500, "ERROR", "Internal server error");
  }
};

exports.acceptPersonRecord = async (req, res) => {
  try {
    const userId = req.user.userId;
    const recordId = req.params.id;

    const record = await PersonRecord.findByPk(recordId);
    if (!record) {
      return sendResponse(res, 404, "ERROR", "Person record not found");
    }

    if (record.targetUserId !== userId) {
      return sendResponse(res, 403, "ERROR", "Only the target user can accept this record");
    }

    if (record.status !== "PENDING") {
      return sendResponse(res, 400, "ERROR", "Only pending records can be accepted");
    }

    await record.update({ status: "ACCEPTED" });

    // Mark notification as read
    await Notification.update({ isRead: true }, {
      where: { personRecordId: recordId, recipientId: userId, type: "PERSON_RECORD_REQUEST" }
    });



    return sendResponse(res, 200, "SUCCESS", "Person record accepted successfully");
  } catch (error) {
    console.error("Error accepting person record:", error);
    return sendResponse(res, 500, "ERROR", "Internal server error");
  }
};

exports.rejectPersonRecord = async (req, res) => {
  try {
    const userId = req.user.userId;
    const recordId = req.params.id;

    const record = await PersonRecord.findByPk(recordId);
    if (!record) {
      return sendResponse(res, 404, "ERROR", "Person record not found");
    }

    if (record.targetUserId !== userId) {
      return sendResponse(res, 403, "ERROR", "Only the target user can reject this record");
    }

    if (record.status !== "PENDING") {
      return sendResponse(res, 400, "ERROR", "Only pending records can be rejected");
    }

    await record.update({ status: "REJECTED" });

    // Mark notification as read
    await Notification.update({ isRead: true }, {
      where: { personRecordId: recordId, recipientId: userId, type: "PERSON_RECORD_REQUEST" }
    });



    return sendResponse(res, 200, "SUCCESS", "Person record rejected successfully");
  } catch (error) {
    console.error("Error rejecting person record:", error);
    return sendResponse(res, 500, "ERROR", "Internal server error");
  }
};

exports.completePersonRecord = async (req, res) => {
  try {
    const userId = req.user.userId;
    const recordId = req.params.id;

    const record = await PersonRecord.findByPk(recordId);
    if (!record) {
      return sendResponse(res, 404, "ERROR", "Person record not found");
    }

    if (record.ownerId !== userId) {
      return sendResponse(res, 403, "ERROR", "Only the owner can complete this record");
    }

    await record.update({ status: "COMPLETED" });



    return sendResponse(res, 200, "SUCCESS", "Person record marked as completed");
  } catch (error) {
    console.error("Error completing person record:", error);
    return sendResponse(res, 500, "ERROR", "Internal server error");
  }
};
