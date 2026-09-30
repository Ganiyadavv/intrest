const { LenderRecord, User, Notification } = require("../models");
const { Op } = require("sequelize");

class LenderRecordService {
  async createLenderRecord(ownerId, data) {
    let targetUserId = null;
    let { userId, name, fatherName, phoneNumber, village, mandal, pincode, district, state, country, amount, interestRate, receivedDate, paymentScreenshot, notes } = data;

    if (userId) {
      userId = userId.trim().toUpperCase();
      const userIdRegex = /^USR-[A-Z0-9]{8}$/;
      if (!userIdRegex.test(userId)) {
        throw new Error("User ID format is invalid");
      }

      const targetUser = await User.findOne({ where: { userId } });
      if (!targetUser) {
        throw new Error("Target user not found");
      }
      targetUserId = targetUser.id;
    }

    const lenderRecord = await LenderRecord.create({
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
      receivedDate,
      paymentScreenshot,
      notes,
      status: "PENDING"
    });

    if (targetUserId) {
      await Notification.create({
        recipientId: targetUserId,
        senderId: ownerId,
        lenderRecordId: lenderRecord.id,
        type: "LENDER_RECORD_REQUEST",
        title: "Payment Received Notification",
        message: "User has sent you a notification confirming they received a payment from you. Please review the details."
      });
    }

    return lenderRecord;
  }

  async getLenderRecords(ownerId) {
    const records = await LenderRecord.findAll({
      where: { 
        [Op.or]: [
          { ownerId: ownerId },
          { targetUserId: ownerId }
        ]
      },
      include: [
        { model: User, as: 'targetUser', attributes: ['userId', 'firstName', 'lastName'] }
      ]
    });

    return records.map(record => {
      const data = record.toJSON();
      if (data.targetUser && data.targetUser.userId) {
        data.targetUserId = data.targetUser.userId;
      }
      return data;
    });
  }

  async getLenderRecordById(ownerId, recordId) {
    const record = await LenderRecord.findByPk(recordId, {
      include: [
        { model: User, as: 'targetUser', attributes: ['userId', 'firstName', 'lastName'] }
      ]
    });

    if (!record) {
      throw new Error("Lender record not found");
    }

    if (record.ownerId !== ownerId && record.targetUserId !== ownerId) {
      throw new Error("You do not have permission to access this record");
    }

    const formattedRecord = record.toJSON();
    if (formattedRecord.targetUser && formattedRecord.targetUser.userId) {
      formattedRecord.targetUserId = formattedRecord.targetUser.userId;
    }

    return formattedRecord;
  }

  async updateLenderRecord(ownerId, recordId, data) {
    const record = await LenderRecord.findByPk(recordId);

    if (!record) {
      throw new Error("Lender record not found");
    }

    if (record.ownerId !== ownerId) {
      throw new Error("You can only edit your own records");
    }

    const { name, fatherName, phoneNumber, village, mandal, pincode, district, state, country, amount, interestRate, receivedDate, notes, paymentScreenshot } = data;

    const updateData = { name, fatherName, phoneNumber, village, mandal, pincode, district, state, country, amount, interestRate, receivedDate, notes };
    
    if (paymentScreenshot !== undefined) {
      updateData.paymentScreenshot = paymentScreenshot;
    }

    await record.update(updateData);

    return record;
  }

  async deleteLenderRecord(ownerId, recordId) {
    const record = await LenderRecord.findByPk(recordId);

    if (!record) {
      throw new Error("Lender record not found");
    }

    if (record.ownerId !== ownerId) {
      throw new Error("You can only delete your own records");
    }

    await Notification.destroy({ where: { lenderRecordId: recordId } });
    await record.destroy();
    return true;
  }

  async acceptLenderRecord(userId, recordId) {
    const record = await LenderRecord.findByPk(recordId);
    if (!record) {
      throw new Error("Lender record not found");
    }

    // Only target user (lender) can accept
    if (record.targetUserId !== userId) {
      throw new Error("Only the target user can accept this record");
    }

    if (record.status !== "PENDING") {
      throw new Error("Only pending records can be accepted");
    }

    await record.update({ status: "ACCEPTED" });

    await Notification.update({ isRead: true }, {
      where: { lenderRecordId: recordId, recipientId: userId, type: "LENDER_RECORD_REQUEST" }
    });

    return record;
  }

  async rejectLenderRecord(userId, recordId) {
    const record = await LenderRecord.findByPk(recordId);
    if (!record) {
      throw new Error("Lender record not found");
    }

    if (record.targetUserId !== userId) {
      throw new Error("Only the target user can reject this record");
    }

    if (record.status !== "PENDING") {
      throw new Error("Only pending records can be rejected");
    }

    await record.update({ status: "REJECTED" });

    await Notification.update({ isRead: true }, {
      where: { lenderRecordId: recordId, recipientId: userId, type: "LENDER_RECORD_REQUEST" }
    });

    return record;
  }

  async completeLenderRecord(ownerId, recordId) {
    const record = await LenderRecord.findByPk(recordId);
    if (!record) {
      throw new Error("Lender record not found");
    }

    if (record.ownerId !== ownerId) {
      throw new Error("Only the owner can complete this record");
    }

    await record.update({ status: "COMPLETED" });
    return record;
  }
}

module.exports = new LenderRecordService();
