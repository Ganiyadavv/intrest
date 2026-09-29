const calculateMonthlyInterest = (principalAmount, ptr) => {
  return (principalAmount * ptr) / 100;
};

const calculateCompletedMonths = (loanDate) => {
  const loanDateObj = new Date(loanDate);
  const currentDate = new Date();
  
  const yearsDiff = currentDate.getFullYear() - loanDateObj.getFullYear();
  const monthsDiff = currentDate.getMonth() - loanDateObj.getMonth();
  
  let completedMonths = yearsDiff * 12 + monthsDiff;
  
  if (currentDate.getDate() < loanDateObj.getDate()) {
    completedMonths -= 1;
  }
  
  return Math.max(0, completedMonths);
};

module.exports = {
  calculateMonthlyInterest,
  calculateCompletedMonths
};
