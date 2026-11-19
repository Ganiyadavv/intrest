const { LenderRecord, LenderRecordRepayment, PersonRecord, User, Notification } = require("../models");
const { Op } = require("sequelize");

// Helper to compute lender total payable (principal + accrued simple interest)
const computeTotalPayable = (record, extraDays = 0) => {
  const d1 = new Date(record.receivedDate);
  const d2 = new Date();
  if (extraDays) d2.setDate(d2.getDate() + extraDays);

  let years = d2.getFullYear() - d1.getFullYear();
  let months = d2.getMonth() - d1.getMonth();
  let days = d2.getDate() - d1.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(d2.getFullYear(), d2.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const totalMonths = Math.max(0, years * 12 + months + days / 30);
  const principal = Number(record.amount) || 0;
  const rate = Number(record.interestRate) || 0;
  const interest = (principal * rate * totalMonths) / 100;
  return Math.max(0, principal + interest);
};

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
    // Only return records created/owned by ownerId.
    // Incoming requests (whether pending, accepted or completed) are managed strictly in the Incoming Requests screen.
    const lenderRecords = await LenderRecord.findAll({
      where: { ownerId },
      attributes: { exclude: ['paymentScreenshot'] },
      include: [
        { model: User, as: 'targetUser', attributes: ['userId', 'fullName'] },
        { model: User, as: 'owner', attributes: ['userId', 'fullName'] },
        { model: LenderRecordRepayment, as: 'repayments', attributes: ['id', 'amount', 'returnDate'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    return lenderRecords.map(record => {
      const data = record.toJSON();
      if (data.targetUser && data.targetUser.userId) {
        data.targetUserId = data.targetUser.userId;
      }
      data.totalReturned = (data.repayments || []).reduce((sum, r) => sum + Number(r.amount || 0), 0);
      return data;
    });
  }

  async getLenderRecordById(ownerId, recordId) {
    const record = await LenderRecord.findByPk(recordId, {
      include: [
        { model: User, as: 'targetUser', attributes: ['userId', 'fullName'] },
        { model: User, as: 'owner', attributes: ['id', 'userId', 'fullName'] },
        {
          model: LenderRecordRepayment,
          as: 'repayments',
          separate: true,
          order: [['returnDate', 'DESC'], ['createdAt', 'DESC']]
        }
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
    formattedRecord.totalReturned = (formattedRecord.repayments || []).reduce(
      (sum, r) => sum + Number(r.amount || 0),
      0
    );

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
    await LenderRecordRepayment.destroy({ where: { lenderRecordId: recordId } });
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
    const record = await LenderRecord.findByPk(recordId);
    if (!record) {
      throw new Error("Lender record not found");
    }

    if (record.ownerId !== ownerId) {
      throw new Error("Only the user who sent this request can mark it as complete");
    }

    await record.update({ status: "COMPLETED" });
    return record;
  }

  async addLenderRepayment(userId, recordId, data) {
    const { amount, returnDate, notes, paymentScreenshot } = data;

    const record = await LenderRecord.findByPk(recordId, {
      include: [{ model: LenderRecordRepayment, as: 'repayments' }]
    });

    if (!record) {
      throw new Error("Lender record not found");
    }

    if (record.ownerId !== userId) {
      throw new Error("Only the owner can record repayments for this lender record");
    }

    if (record.status === "REJECTED") {
      throw new Error("Cannot record repayment on a rejected record");
    }

    if (record.status === "COMPLETED") {
      throw new Error("This lender record is already completed");
    }

    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new Error("Return amount must be greater than 0");
    }

    const existingReturned = (record.repayments || []).reduce(
      (sum, r) => sum + Number(r.amount || 0),
      0
    );

    const maxTotalPayable = computeTotalPayable(record, 1);
    const remainingAllowed = Math.max(0, maxTotalPayable - existingReturned);
    if (parsedAmount > remainingAllowed + 1) {
      throw new Error(`Return amount cannot exceed remaining balance of ₹${remainingAllowed.toFixed(2)}`);
    }

    const effectiveDate = returnDate || new Date().toISOString().split('T')[0];

    const repayment = await LenderRecordRepayment.create({
      lenderRecordId: record.id,
      amount: parsedAmount,
      returnDate: effectiveDate,
      notes: notes ? String(notes).trim() : null,
      paymentScreenshot: paymentScreenshot || null
    });

    const newTotalReturned = Number((existingReturned + parsedAmount).toFixed(2));
    const currentTotalPayable = computeTotalPayable(record, 0);

    // If lender was paid back the full payable amount, automatically mark COMPLETED
    if (newTotalReturned >= currentTotalPayable - 0.01 && currentTotalPayable > 0) {
      await record.update({ status: "COMPLETED" });
    }

    return {
      repayment,
      totalReturned: newTotalReturned,
      status: record.status
    };
  }

  async deleteLenderRepayment(userId, recordId, repaymentId) {
    const record = await LenderRecord.findByPk(recordId);
    if (!record) {
      throw new Error("Lender record not found");
    }

    if (record.ownerId !== userId) {
      throw new Error("Only the owner can delete repayments for this lender record");
    }

    const repayment = await LenderRecordRepayment.findOne({
      where: { id: repaymentId, lenderRecordId: recordId }
    });

    if (!repayment) {
      throw new Error("Repayment entry not found");
    }

    await repayment.destroy();

    const remainingRepayments = await LenderRecordRepayment.findAll({
      where: { lenderRecordId: recordId }
    });
    const newTotalReturned = remainingRepayments.reduce((sum, r) => sum + Number(r.amount || 0), 0);

    // If record was marked COMPLETED and balance is now remaining, revert status safely
    if (record.status === "COMPLETED") {
      const currentTotalPayable = computeTotalPayable(record, 0);
      if (newTotalReturned < currentTotalPayable - 0.01) {
        await record.update({ status: record.targetUserId ? "ACCEPTED" : "PENDING" });
      }
    }

    return {
      totalReturned: Number(newTotalReturned.toFixed(2)),
      status: record.status
    };
  }
}

module.exports = new LenderRecordService();
