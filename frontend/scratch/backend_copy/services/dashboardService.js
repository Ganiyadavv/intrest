const { getLoansByUserId } = require('./loanService');
const { Payment } = require('../models');

const getDashboard = async (userId) => {
  const loans = await getLoansByUserId(userId);
  
  let totalPrincipal = 0;
  let monthlyInterest = 0;
  let totalInterest = 0;
  let outstandingAmount = 0;
  let activeLoans = 0;
  
  loans.forEach(loan => {
    totalPrincipal += loan.principalAmount;
    if (loan.status === 'ACTIVE') {
      activeLoans += 1;
    }
    monthlyInterest += loan.monthlyInterest;
    totalInterest += loan.totalInterest;
    outstandingAmount += loan.outstandingAmount;
  });

  const totalPaid = await Payment.sum('amount', { where: { userId } }) || 0;

  return {
    totalPrincipal: Number(totalPrincipal.toFixed(2)),
    monthlyInterest: Number(monthlyInterest.toFixed(2)),
    totalInterest: Number(totalInterest.toFixed(2)),
    totalPaid: Number(totalPaid.toFixed(2)),
    outstandingAmount: Number(outstandingAmount.toFixed(2)),
    activeLoans
  };
};

module.exports = { getDashboard };
