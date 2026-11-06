const { PersonRecord, LenderRecord, User, Notification } = require("../models");
const { Op } = require("sequelize");
const lenderRecordService = require("../services/lenderRecordService");

const sendResponse = (res, statusCode, status, message, data = null) => {
  const response = { statusCode, status, message };
  if (data !== null) response.data = data;
  return res.status(statusCode).json(response);
};

exports.getIncomingRequests = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [lenderRecords, personRecords] = await Promise.all([
      LenderRecord.findAll({
        where: { targetUserId: userId },
        include: [
          { model: User, as: 'owner', attributes: ['id', 'userId', 'fullName', 'email'] }
        ],
        order: [['createdAt', 'DESC']]
      }),
      PersonRecord.findAll({
        where: { targetUserId: userId },
        include: [
          { model: User, as: 'owner', attributes: ['id', 'userId', 'fullName', 'email'] }
        ],
        order: [['createdAt', 'DESC']]
      })
    ]);

    const formattedLenders = lenderRecords.map(r => ({
      id: r.id,
      recordType: 'LENDER_RECORD',
      amount: r.amount,
      interestRate: r.interestRate,
      interestFrequency: 'Monthly',
      name: r.name,
      phoneNumber: r.phoneNumber,
      fatherName: r.fatherName,
      village: r.village,
      mandal: r.mandal,
      district: r.district,
      state: r.state,
      country: r.country,
      pincode: r.pincode,
      date: r.receivedDate,
      receivedDate: r.receivedDate,
      notes: r.notes,
      paymentScreenshot: r.paymentScreenshot,
      status: r.status,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      sender: {
        id: r.owner?.id,
        userId: r.owner?.userId,
        name: r.owner?.fullName || 'User',
        email: r.owner?.email
      }
    }));

    const formattedPersons = personRecords.map(r => ({
      id: r.id,
      recordType: 'PERSON_RECORD',
      amount: r.amount,
      interestRate: r.interestRate,
      interestFrequency: 'Monthly',
      name: r.name,
      phoneNumber: r.phoneNumber,
      fatherName: r.fatherName,
      village: r.village,
      mandal: r.mandal,
      district: r.district,
      state: r.state,
      country: r.country,
      pincode: r.pincode,
      date: r.givenDate,
      givenDate: r.givenDate,
      notes: r.notes,
      paymentScreenshot: r.paymentScreenshot,
      status: r.status,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      sender: {
        id: r.owner?.id,
        userId: r.owner?.userId,
        name: r.owner?.fullName || 'User',
        email: r.owner?.email
      }
    }));

    const combined = [...formattedLenders, ...formattedPersons].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return sendResponse(res, 200, "SUCCESS", "Incoming requests fetched successfully", combined);
  } catch (error) {
    console.error("Error fetching incoming requests:", error);
    return sendResponse(res, 500, "ERROR", "Internal server error");
  }
};

exports.getSentRequests = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [lenderRecords, personRecords] = await Promise.all([
      LenderRecord.findAll({
        where: { 
          ownerId: userId,
          targetUserId: { [Op.ne]: null }
        },
        include: [
          { model: User, as: 'targetUser', attributes: ['id', 'userId', 'fullName', 'email'] }
        ],
        order: [['createdAt', 'DESC']]
      }),
      PersonRecord.findAll({
        where: { 
          ownerId: userId,
          targetUserId: { [Op.ne]: null }
        },
        include: [
          { model: User, as: 'targetUser', attributes: ['id', 'userId', 'fullName', 'email'] }
        ],
        order: [['createdAt', 'DESC']]
      })
    ]);

    const formattedLenders = lenderRecords.map(r => ({
      id: r.id,
      recordType: 'LENDER_RECORD',
      amount: r.amount,
      interestRate: r.interestRate,
      interestFrequency: 'Monthly',
      name: r.name,
      phoneNumber: r.phoneNumber,
      fatherName: r.fatherName,
      date: r.receivedDate,
      receivedDate: r.receivedDate,
      notes: r.notes,
      paymentScreenshot: r.paymentScreenshot,
      status: r.status,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      recipient: {
        id: r.targetUser?.id,
        userId: r.targetUser?.userId,
        name: r.targetUser?.fullName || r.name,
        email: r.targetUser?.email
      }
    }));

    const formattedPersons = personRecords.map(r => ({
      id: r.id,
      recordType: 'PERSON_RECORD',
      amount: r.amount,
      interestRate: r.interestRate,
      interestFrequency: 'Monthly',
      name: r.name,
      phoneNumber: r.phoneNumber,
      fatherName: r.fatherName,
      date: r.givenDate,
      givenDate: r.givenDate,
      notes: r.notes,
      paymentScreenshot: r.paymentScreenshot,
      status: r.status,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      recipient: {
        id: r.targetUser?.id,
        userId: r.targetUser?.userId,
        name: r.targetUser?.fullName || r.name,
        email: r.targetUser?.email
      }
    }));

    const combined = [...formattedLenders, ...formattedPersons].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return sendResponse(res, 200, "SUCCESS", "Sent requests fetched successfully", combined);
  } catch (error) {
    console.error("Error fetching sent requests:", error);
    return sendResponse(res, 500, "ERROR", "Internal server error");
  }
};

exports.getRequestDetails = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { recordType, recordId } = req.params;

    let record = null;
    if (recordType === 'LENDER_RECORD') {
      record = await LenderRecord.findByPk(recordId, {
        include: [
          { model: User, as: 'owner', attributes: ['id', 'userId', 'fullName', 'email'] },
          { model: User, as: 'targetUser', attributes: ['id', 'userId', 'fullName', 'email'] }
        ]
      });
    } else {
      record = await PersonRecord.findByPk(recordId, {
        include: [
          { model: User, as: 'owner', attributes: ['id', 'userId', 'fullName', 'email'] },
          { model: User, as: 'targetUser', attributes: ['id', 'userId', 'fullName', 'email'] }
        ]
      });
    }

    if (!record) {
      return sendResponse(res, 404, "ERROR", "Request not found");
    }

    if (record.ownerId !== userId && record.targetUserId !== userId) {
      return sendResponse(res, 403, "ERROR", "You are not authorized to view this request");
    }

    const data = {
      ...record.toJSON(),
      recordType,
      interestFrequency: 'Monthly',
      date: record.receivedDate || record.givenDate,
      sender: record.owner ? {
        id: record.owner.id,
        userId: record.owner.userId,
        name: record.owner.fullName,
        email: record.owner.email
      } : null,
      recipient: record.targetUser ? {
        id: record.targetUser.id,
        userId: record.targetUser.userId,
        name: record.targetUser.fullName,
        email: record.targetUser.email
      } : null
    };

    return sendResponse(res, 200, "SUCCESS", "Request details fetched successfully", data);
  } catch (error) {
    console.error("Error fetching request details:", error);
    return sendResponse(res, 500, "ERROR", "Internal server error");
  }
};

exports.acceptRequest = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { recordType, recordId } = req.params;

    if (recordType === 'LENDER_RECORD') {
      await lenderRecordService.acceptLenderRecord(userId, recordId);
    } else {
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
    }

    return sendResponse(res, 200, "SUCCESS", "Request accepted successfully");
  } catch (error) {
    if (error.message.includes("Only the target user")) {
      return sendResponse(res, 403, "ERROR", error.message);
    }
    if (error.message.includes("Only pending records")) {
      return sendResponse(res, 400, "ERROR", error.message);
    }
    console.error("Error accepting request:", error);
    return sendResponse(res, 500, "ERROR", "Internal server error");
  }
};

exports.rejectRequest = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { recordType, recordId } = req.params;

    if (recordType === 'LENDER_RECORD') {
      await lenderRecordService.rejectLenderRecord(userId, recordId);
    } else {
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
    }

    return sendResponse(res, 200, "SUCCESS", "Request rejected successfully");
  } catch (error) {
    if (error.message.includes("Only the target user")) {
      return sendResponse(res, 403, "ERROR", error.message);
    }
    if (error.message.includes("Only pending records")) {
      return sendResponse(res, 400, "ERROR", error.message);
    }
    console.error("Error rejecting request:", error);
    return sendResponse(res, 500, "ERROR", "Internal server error");
  }
};

exports.completeRequest = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { recordType, recordId } = req.params;

    if (recordType === 'LENDER_RECORD') {
      const record = await LenderRecord.findByPk(recordId);
      if (!record) {
        return sendResponse(res, 404, "ERROR", "Lender record not found");
      }
      if (record.ownerId !== userId) {
        return sendResponse(res, 403, "ERROR", "Only the user who sent this request can mark it as complete");
      }
      await record.update({ status: "COMPLETED" });
      return sendResponse(res, 200, "SUCCESS", "Request marked as completed");
    } else {
      const record = await PersonRecord.findByPk(recordId);
      if (!record) {
        return sendResponse(res, 404, "ERROR", "Person record not found");
      }
      if (record.ownerId !== userId) {
        return sendResponse(res, 403, "ERROR", "Only the user who sent this request can mark it as complete");
      }
      await record.update({ status: "COMPLETED" });
      return sendResponse(res, 200, "SUCCESS", "Request marked as completed");
    }
  } catch (error) {
    console.error("Error completing request:", error);
    return sendResponse(res, 500, "ERROR", "Internal server error");
  }
};

