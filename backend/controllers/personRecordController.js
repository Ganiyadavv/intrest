const { PersonRecord, LenderRecord, User, Notification } = require("../models");
const { Op } = require("sequelize");

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
      const sender = await User.findByPk(ownerId);
      const senderName = sender?.fullName || sender?.name || "User";

      await Notification.create({
        recipientId: targetUserId,
        senderId: ownerId,
        personRecordId: personRecord.id,
        type: "PERSON_RECORD_REQUEST",
        title: "Payment Request from " + senderName,
        message: `${senderName} has sent you a payment request with the amount and interest details. Please review the payment details and accept or reject the request.`
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

    // 1. Records created by ownerId as PersonRecord (where ownerId gave money to someone)
    const personRecords = await PersonRecord.findAll({
      where: { ownerId },
      attributes: { exclude: ['paymentScreenshot'] },
      include: [
        { model: User, as: 'targetUser', attributes: ['userId', 'fullName'] },
        { model: User, as: 'owner', attributes: ['userId', 'fullName'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    // 2. Records created by others as LenderRecord (Lender for them = they borrowed money from ownerId) that ownerId accepted!
    // To ownerId, this is a Borrower Record (money given to them)!
    const acceptedLenderRecords = await LenderRecord.findAll({
      where: { targetUserId: ownerId, status: "ACCEPTED" },
      attributes: { exclude: ['paymentScreenshot'] },
      include: [
        { model: User, as: 'targetUser', attributes: ['userId', 'fullName'] },
        { model: User, as: 'owner', attributes: ['userId', 'fullName'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    const formattedPersons = personRecords.map(record => {
      const data = record.toJSON();
      if (data.targetUser && data.targetUser.userId) {
        data.targetUserId = data.targetUser.userId;
      }
      return data;
    });

    const formattedAccepted = acceptedLenderRecords.map(record => {
      const data = record.toJSON();
      return {
        ...data,
        name: data.owner?.fullName || data.name,
        targetUserId: data.owner?.userId,
        givenDate: data.receivedDate,
        recordType: 'LENDER_RECORD',
      };
    });

    const allRecords = [...formattedPersons, ...formattedAccepted].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return sendResponse(res, 200, "SUCCESS", "Person records fetched successfully", allRecords);
  } catch (error) {
    console.error("Error fetching person records:", error);
    return sendResponse(res, 500, "ERROR", "Internal server error");
  }
};

exports.getPersonRecord = async (req, res) => {
  try {
    const userId = req.user.userId;
    const recordId = req.params.id;

    let record = await PersonRecord.findByPk(recordId, {
      include: [
        { model: User, as: 'targetUser', attributes: ['userId', 'fullName'] },
        { model: User, as: 'owner', attributes: ['id', 'userId', 'fullName'] }
      ]
    });

    if (record && (record.ownerId === userId || record.targetUserId === userId)) {
      const formattedRecord = record.toJSON();
      if (formattedRecord.ownerId !== userId) {
        formattedRecord.name = formattedRecord.owner?.fullName || formattedRecord.name;
        formattedRecord.targetUserId = formattedRecord.owner?.userId;
      } else if (formattedRecord.targetUser && formattedRecord.targetUser.userId) {
        formattedRecord.targetUserId = formattedRecord.targetUser.userId;
      }
      return sendResponse(res, 200, "SUCCESS", "Person record fetched successfully", formattedRecord);
    }

    // Also check if it's an accepted LenderRecord where current user is target (borrower)
    const lenderRecord = await LenderRecord.findByPk(recordId, {
      include: [
        { model: User, as: 'targetUser', attributes: ['userId', 'fullName'] },
        { model: User, as: 'owner', attributes: ['id', 'userId', 'fullName'] }
      ]
    });

    if (lenderRecord && (lenderRecord.targetUserId === userId || lenderRecord.ownerId === userId)) {
      const formatted = lenderRecord.toJSON();
      const mapped = {
        ...formatted,
        name: formatted.owner?.fullName || formatted.name,
        targetUserId: formatted.owner?.userId,
        givenDate: formatted.receivedDate,
        recordType: 'LENDER_RECORD',
      };
      return sendResponse(res, 200, "SUCCESS", "Person record fetched successfully", mapped);
    }

    return sendResponse(res, 404, "ERROR", "Person record not found");
  } catch (error) {
    console.error("Error fetching person record:", error);
    return sendResponse(res, 500, "ERROR", "Internal server error");
  }
};
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

    const recipientUser = await User.findByPk(userId);
    const recipientName = recipientUser?.fullName || "Recipient";
    await Notification.create({
      recipientId: record.ownerId,
      senderId: userId,
      personRecordId: record.id,
      type: "PERSON_RECORD_ACCEPTED",
      title: "Request Accepted",
      message: `${recipientName} has accepted your borrower request for ₹${Number(record.amount).toLocaleString('en-IN')}.`
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

    const recipientUser = await User.findByPk(userId);
    const recipientName = recipientUser?.fullName || "Recipient";
    await Notification.create({
      recipientId: record.ownerId,
      senderId: userId,
      personRecordId: record.id,
      type: "PERSON_RECORD_REJECTED",
      title: "Request Rejected",
      message: `${recipientName} has rejected your borrower request for ₹${Number(record.amount).toLocaleString('en-IN')}.`
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

    let record = await PersonRecord.findByPk(recordId);
    if (record && (record.ownerId === userId || record.targetUserId === userId)) {
      await record.update({ status: "COMPLETED" });
      return sendResponse(res, 200, "SUCCESS", "Person record marked as completed");
    }

    let lRecord = await LenderRecord.findByPk(recordId);
    if (lRecord && (lRecord.ownerId === userId || lRecord.targetUserId === userId)) {
      await lRecord.update({ status: "COMPLETED" });
      return sendResponse(res, 200, "SUCCESS", "Person record marked as completed");
    }

    return sendResponse(res, 404, "ERROR", "Person record not found");
  } catch (error) {
    console.error("Error completing person record:", error);
    return sendResponse(res, 500, "ERROR", "Internal server error");
  }
};
