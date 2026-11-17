const { PersonalRecord, PersonalRecordRepayment, User } = require("../models");

// Helper to format consistent API responses
const sendResponse = (res, statusCode, status, message, data = null) => {
  const response = { statusCode, status, message };
  if (data !== null) response.data = data;
  return res.status(statusCode).json(response);
};

// 1. Create a new Personal Record (Interest-Free Loan or Gift)
exports.createPersonalRecord = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    let {
      name,
      relationship,
      phoneNumber,
      recordType = "INTEREST_FREE",
      amount,
      givenDate,
      expectedReturnDate,
      notes,
    } = req.body;

    if (!name || !name.trim()) {
      return sendResponse(res, 400, "ERROR", "Person name is required");
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return sendResponse(res, 400, "ERROR", "Please provide a valid amount greater than 0");
    }

    if (!givenDate) {
      return sendResponse(res, 400, "ERROR", "Given date is required");
    }

    let paymentScreenshot = null;
    if (req.file) {
      paymentScreenshot = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    } else if (req.body.paymentScreenshot) {
      paymentScreenshot = req.body.paymentScreenshot;
    }

    const isGift = recordType === "GIFT";
    const initialStatus = isGift ? "GIFT" : "PENDING";
    const remainingAmount = isGift ? 0.00 : parsedAmount;

    const record = await PersonalRecord.create({
      ownerId,
      name: name.trim(),
      relationship: relationship ? relationship.trim() : "Friend",
      phoneNumber: phoneNumber ? phoneNumber.trim() : null,
      recordType: isGift ? "GIFT" : "INTEREST_FREE",
      amount: parsedAmount,
      givenDate,
      expectedReturnDate: isGift ? null : (expectedReturnDate || null),
      notes: notes ? notes.trim() : null,
      paymentScreenshot,
      totalReturned: 0.00,
      remainingAmount,
      status: initialStatus,
    });

    return sendResponse(res, 201, "SUCCESS", "Personal record created successfully", record);
  } catch (error) {
    console.error("Error creating personal record:", error);
    return sendResponse(res, 500, "ERROR", error.message || "Internal server error");
  }
};

// 2. Get all Personal Records for current user
exports.getPersonalRecords = async (req, res) => {
  try {
    const ownerId = req.user.userId;

    const records = await PersonalRecord.findAll({
      where: { ownerId },
      attributes: { exclude: ["paymentScreenshot"] }, // Exclude heavy image data for list
      include: [
        {
          model: PersonalRecordRepayment,
          as: "repayments",
          attributes: ["id", "amount", "returnDate", "notes", "createdAt"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return sendResponse(res, 200, "SUCCESS", "Personal records fetched successfully", records);
  } catch (error) {
    console.error("Error fetching personal records:", error);
    return sendResponse(res, 500, "ERROR", "Internal server error");
  }
};

// 3. Get single Personal Record details
exports.getPersonalRecord = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const { id } = req.params;

    const record = await PersonalRecord.findByPk(id, {
      include: [
        {
          model: PersonalRecordRepayment,
          as: "repayments",
          order: [["returnDate", "DESC"], ["createdAt", "DESC"]],
        },
      ],
    });

    if (!record) {
      return sendResponse(res, 404, "ERROR", "Personal record not found");
    }

    if (record.ownerId !== ownerId) {
      return sendResponse(res, 403, "ERROR", "You do not have permission to view this record");
    }

    return sendResponse(res, 200, "SUCCESS", "Personal record fetched successfully", record);
  } catch (error) {
    console.error("Error fetching personal record details:", error);
    return sendResponse(res, 500, "ERROR", "Internal server error");
  }
};

// 4. Update Personal Record
exports.updatePersonalRecord = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const { id } = req.params;

    const record = await PersonalRecord.findByPk(id);
    if (!record) {
      return sendResponse(res, 404, "ERROR", "Personal record not found");
    }

    if (record.ownerId !== ownerId) {
      return sendResponse(res, 403, "ERROR", "You do not have permission to edit this record");
    }

    const {
      name,
      relationship,
      phoneNumber,
      amount,
      givenDate,
      expectedReturnDate,
      notes,
    } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (relationship !== undefined) updateData.relationship = relationship.trim();
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber ? phoneNumber.trim() : null;
    if (givenDate !== undefined) updateData.givenDate = givenDate;
    if (expectedReturnDate !== undefined) updateData.expectedReturnDate = expectedReturnDate || null;
    if (notes !== undefined) updateData.notes = notes ? notes.trim() : null;

    if (req.file) {
      updateData.paymentScreenshot = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    } else if (req.body.paymentScreenshot !== undefined) {
      updateData.paymentScreenshot = req.body.paymentScreenshot;
    }

    if (amount !== undefined) {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return sendResponse(res, 400, "ERROR", "Please provide a valid amount");
      }
      updateData.amount = parsedAmount;

      if (record.recordType === "INTEREST_FREE") {
        const totalRet = parseFloat(record.totalReturned) || 0;
        const newRemaining = Math.max(0, parsedAmount - totalRet);
        updateData.remainingAmount = newRemaining;

        if (totalRet <= 0) {
          updateData.status = "PENDING";
        } else if (newRemaining <= 0) {
          updateData.status = "FULLY_RETURNED";
        } else {
          updateData.status = "PARTIALLY_RETURNED";
        }
      }
    }

    await record.update(updateData);

    const updated = await PersonalRecord.findByPk(id, {
      include: [{ model: PersonalRecordRepayment, as: "repayments" }],
    });

    return sendResponse(res, 200, "SUCCESS", "Personal record updated successfully", updated);
  } catch (error) {
    console.error("Error updating personal record:", error);
    return sendResponse(res, 500, "ERROR", "Internal server error");
  }
};

// 5. Delete Personal Record
exports.deletePersonalRecord = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const { id } = req.params;

    const record = await PersonalRecord.findByPk(id);
    if (!record) {
      return sendResponse(res, 404, "ERROR", "Personal record not found");
    }

    if (record.ownerId !== ownerId) {
      return sendResponse(res, 403, "ERROR", "You do not have permission to delete this record");
    }

    await PersonalRecordRepayment.destroy({ where: { personalRecordId: id } });
    await record.destroy();

    return sendResponse(res, 200, "SUCCESS", "Personal record deleted successfully");
  } catch (error) {
    console.error("Error deleting personal record:", error);
    return sendResponse(res, 500, "ERROR", "Internal server error");
  }
};

// 6. Record a Return (Repayment)
exports.addRepayment = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const { id } = req.params;
    const { amount, returnDate, notes } = req.body;

    const record = await PersonalRecord.findByPk(id);
    if (!record) {
      return sendResponse(res, 404, "ERROR", "Personal record not found");
    }

    if (record.ownerId !== ownerId) {
      return sendResponse(res, 403, "ERROR", "You do not have permission to modify this record");
    }

    if (record.recordType === "GIFT") {
      return sendResponse(res, 400, "ERROR", "Gift records do not accept repayment entries");
    }

    const repaymentAmount = parseFloat(amount);
    if (isNaN(repaymentAmount) || repaymentAmount <= 0) {
      return sendResponse(res, 400, "ERROR", "Please provide a valid repayment amount greater than 0");
    }

    if (!returnDate) {
      return sendResponse(res, 400, "ERROR", "Return date is required");
    }

    let paymentScreenshot = null;
    if (req.file) {
      paymentScreenshot = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    } else if (req.body.paymentScreenshot) {
      paymentScreenshot = req.body.paymentScreenshot;
    }

    const repayment = await PersonalRecordRepayment.create({
      personalRecordId: id,
      amount: repaymentAmount,
      returnDate,
      notes: notes ? notes.trim() : null,
      paymentScreenshot,
    });

    // Recalculate total returned and remaining balance
    const allRepayments = await PersonalRecordRepayment.findAll({
      where: { personalRecordId: id },
    });

    const totalReturned = allRepayments.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
    const principal = parseFloat(record.amount) || 0;
    const remainingAmount = Math.max(0, principal - totalReturned);

    let status = "PENDING";
    if (totalReturned > 0 && remainingAmount > 0) {
      status = "PARTIALLY_RETURNED";
    } else if (remainingAmount <= 0) {
      status = "FULLY_RETURNED";
    }

    await record.update({
      totalReturned,
      remainingAmount,
      status,
    });

    const updatedRecord = await PersonalRecord.findByPk(id, {
      include: [
        {
          model: PersonalRecordRepayment,
          as: "repayments",
          order: [["returnDate", "DESC"], ["createdAt", "DESC"]],
        },
      ],
    });

    return sendResponse(res, 201, "SUCCESS", "Return recorded successfully", {
      repayment,
      record: updatedRecord,
    });
  } catch (error) {
    console.error("Error recording repayment:", error);
    return sendResponse(res, 500, "ERROR", "Internal server error");
  }
};

// 7. Delete a Repayment
exports.deleteRepayment = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const { id, repaymentId } = req.params;

    const record = await PersonalRecord.findByPk(id);
    if (!record) {
      return sendResponse(res, 404, "ERROR", "Personal record not found");
    }

    if (record.ownerId !== ownerId) {
      return sendResponse(res, 403, "ERROR", "You do not have permission to modify this record");
    }

    const repayment = await PersonalRecordRepayment.findOne({
      where: { id: repaymentId, personalRecordId: id },
    });

    if (!repayment) {
      return sendResponse(res, 404, "ERROR", "Repayment record not found");
    }

    await repayment.destroy();

    // Recalculate total returned
    const allRepayments = await PersonalRecordRepayment.findAll({
      where: { personalRecordId: id },
    });

    const totalReturned = allRepayments.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
    const principal = parseFloat(record.amount) || 0;
    const remainingAmount = Math.max(0, principal - totalReturned);

    let status = "PENDING";
    if (totalReturned > 0 && remainingAmount > 0) {
      status = "PARTIALLY_RETURNED";
    } else if (remainingAmount <= 0) {
      status = "FULLY_RETURNED";
    }

    await record.update({
      totalReturned,
      remainingAmount,
      status,
    });

    const updatedRecord = await PersonalRecord.findByPk(id, {
      include: [
        {
          model: PersonalRecordRepayment,
          as: "repayments",
          order: [["returnDate", "DESC"], ["createdAt", "DESC"]],
        },
      ],
    });

    return sendResponse(res, 200, "SUCCESS", "Repayment deleted successfully", updatedRecord);
  } catch (error) {
    console.error("Error deleting repayment:", error);
    return sendResponse(res, 500, "ERROR", "Internal server error");
  }
};
