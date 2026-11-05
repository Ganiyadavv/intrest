const { LenderRecord, PersonRecord, User, Notification } = require("../models");
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
      const sender = await User.findByPk(ownerId);
      const senderName = sender?.fullName || sender?.name || "User";

      await Notification.create({
        recipientId: targetUserId,
        senderId: ownerId,
        lenderRecordId: lenderRecord.id,
        type: "LENDER_RECORD_REQUEST",
        title: "Payment Received from " + senderName,
        message: `${senderName} has sent you a notification confirming they received a payment from you. Please review the details.`
      });
    }

    return lenderRecord;
  }

  async getLenderRecords(ownerId) {
    // 1. Records created by ownerId as LenderRecord (where ownerId took/received money)
    const lenderRecords = await LenderRecord.findAll({
      where: { ownerId },
      attributes: { exclude: ['paymentScreenshot'] },
      include: [
        { model: User, as: 'targetUser', attributes: ['userId', 'fullName'] },
        { model: User, as: 'owner', attributes: ['userId', 'fullName'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    // 2. Records created by others as PersonRecord (Borrower for them = they lent money to ownerId) that ownerId accepted!
    // To ownerId, this is a Lender Record (ownerId received money from them)!
    const acceptedPersonRecords = await PersonRecord.findAll({
      where: { targetUserId: ownerId, status: "ACCEPTED" },
      attributes: { exclude: ['paymentScreenshot'] },
      include: [
        { model: User, as: 'targetUser', attributes: ['userId', 'fullName'] },
        { model: User, as: 'owner', attributes: ['userId', 'fullName'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    const formattedLenders = lenderRecords.map(record => {
      const data = record.toJSON();
      if (data.targetUser && data.targetUser.userId) {
        data.targetUserId = data.targetUser.userId;
      }
      return data;
    });

    const formattedAccepted = acceptedPersonRecords.map(record => {
      const data = record.toJSON();
      return {
        ...data,
        name: data.owner?.fullName || data.name,
        targetUserId: data.owner?.userId,
        receivedDate: data.givenDate,
        recordType: 'PERSON_RECORD',
      };
    });

    return [...formattedLenders, ...formattedAccepted].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getLenderRecordById(ownerId, recordId) {
    let record = await LenderRecord.findByPk(recordId, {
      include: [
        { model: User, as: 'targetUser', attributes: ['userId', 'fullName'] },
        { model: User, as: 'owner', attributes: ['id', 'userId', 'fullName'] }
      ]
    });

    if (record && (record.ownerId === ownerId || record.targetUserId === ownerId)) {
      const formattedRecord = record.toJSON();
      if (formattedRecord.ownerId !== ownerId) {
        formattedRecord.name = formattedRecord.owner?.fullName || formattedRecord.name;
        formattedRecord.targetUserId = formattedRecord.owner?.userId;
      } else if (formattedRecord.targetUser && formattedRecord.targetUser.userId) {
        formattedRecord.targetUserId = formattedRecord.targetUser.userId;
      }
      return formattedRecord;
    }

    // Also check PersonRecord where targetUserId = ownerId (accepted borrower record from someone else)
    const personRecord = await PersonRecord.findByPk(recordId, {
      include: [
        { model: User, as: 'targetUser', attributes: ['userId', 'fullName'] },
        { model: User, as: 'owner', attributes: ['id', 'userId', 'fullName'] }
      ]
    });

    if (personRecord && (personRecord.targetUserId === ownerId || personRecord.ownerId === ownerId)) {
      const formatted = personRecord.toJSON();
      return {
        ...formatted,
        name: formatted.owner?.fullName || formatted.name,
        targetUserId: formatted.owner?.userId,
        receivedDate: formatted.givenDate,
        recordType: 'PERSON_RECORD',
      };
    }

    throw new Error("Lender record not found");
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

    const recipientUser = await User.findByPk(userId);
    const recipientName = recipientUser?.fullName || "Recipient";
    await Notification.create({
      recipientId: record.ownerId,
      senderId: userId,
      lenderRecordId: record.id,
      type: "LENDER_RECORD_ACCEPTED",
      title: "Request Accepted",
      message: `${recipientName} has accepted your lender request for ₹${Number(record.amount).toLocaleString('en-IN')}.`
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

    const recipientUser = await User.findByPk(userId);
    const recipientName = recipientUser?.fullName || "Recipient";
    await Notification.create({
      recipientId: record.ownerId,
      senderId: userId,
      lenderRecordId: record.id,
      type: "LENDER_RECORD_REJECTED",
      title: "Request Rejected",
      message: `${recipientName} has rejected your lender request for ₹${Number(record.amount).toLocaleString('en-IN')}.`
    });

    return record;
  }

  async completeLenderRecord(ownerId, recordId) {
    let record = await LenderRecord.findByPk(recordId);
    if (record && (record.ownerId === ownerId || record.targetUserId === ownerId)) {
      await record.update({ status: "COMPLETED" });
      return record;
    }

    let pRecord = await PersonRecord.findByPk(recordId);
    if (pRecord && (pRecord.ownerId === ownerId || pRecord.targetUserId === ownerId)) {
      await pRecord.update({ status: "COMPLETED" });
      return pRecord;
    }

    throw new Error("Lender record not found");
  }
}

module.exports = new LenderRecordService();
