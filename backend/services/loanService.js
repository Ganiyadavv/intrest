const { Loan } = require('../models');
const { calculateMonthlyInterest, calculateCompletedMonths } = require('./interestService');

const calculateLoanDetails = (loan) => {
  const principalAmount = parseFloat(loan.principalAmount);
  const ptr = parseFloat(loan.ptr);
  const paidAmount = parseFloat(loan.paidAmount);

  const monthlyInterest = calculateMonthlyInterest(principalAmount, ptr);
  const completedMonths = calculateCompletedMonths(loan.loanDate);
  const totalInterest = monthlyInterest * completedMonths;
  const outstandingAmount = Math.max(0, principalAmount + totalInterest - paidAmount);

  return {
    ...loan.toJSON(),
    principalAmount,
    ptr,
    paidAmount,
    monthlyInterest: Number(monthlyInterest.toFixed(2)),
    completedMonths,
    totalInterest: Number(totalInterest.toFixed(2)),
    outstandingAmount: Number(outstandingAmount.toFixed(2))
  };
};

const createLoan = async (userId, data) => {
  const loan = await Loan.create({
    userId,
    principalAmount: data.principalAmount,
    ptr: data.ptr,
    loanDate: data.loanDate
  });
  return loan;
};

const getLoansByUserId = async (userId) => {
  const loans = await Loan.findAll({ where: { userId } });
  return loans.map(calculateLoanDetails);
};

const getLoanById = async (id, userId) => {
  const loan = await Loan.findOne({ where: { id, userId } });
  if (!loan) return null;
  return calculateLoanDetails(loan);
};

const updateLoan = async (id, userId, data) => {
  const loan = await Loan.findOne({ where: { id, userId } });
  if (!loan) return null;
  
  if (data.principalAmount !== undefined) loan.principalAmount = data.principalAmount;
  if (data.ptr !== undefined) loan.ptr = data.ptr;
  if (data.loanDate !== undefined) loan.loanDate = data.loanDate;
  if (data.status !== undefined) loan.status = data.status;
  
  await loan.save();
  return calculateLoanDetails(loan);
};

module.exports = {
  createLoan,
  getLoansByUserId,
  getLoanById,
  updateLoan
};
