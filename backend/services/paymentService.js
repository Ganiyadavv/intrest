const { Payment, Loan } = require('../models');

const createPayment = async (userId, data) => {
  const loan = await Loan.findOne({ where: { id: data.loanId, userId } });
  if (!loan) {
    throw new Error('Loan not found or does not belong to user');
  }

  const payment = await Payment.create({
    loanId: data.loanId,
    userId,
    amount: data.amount,
    paymentDate: data.paymentDate
  });

  // Calculate total paid dynamically to ensure accuracy
  const totalPaid = await Payment.sum('amount', { where: { loanId: data.loanId } });
  
  loan.paidAmount = totalPaid;
  await loan.save();

  return payment;
};

const getPaymentsByUserId = async (userId) => {
  return await Payment.findAll({ where: { userId } });
};

module.exports = {
  createPayment,
  getPaymentsByUserId
};
