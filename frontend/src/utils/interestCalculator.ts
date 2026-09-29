export const calculateInterest = (
  principalAmount: number,
  ptr: number
): number => {
  return (principalAmount * ptr) / 100;
};

export const calculateCompletedMonths = (
  loanDate: string
): number => {
  const loanDateObj = new Date(loanDate);
  const currentDate = new Date();
  
  // Calculate difference in months
  const yearsDiff = currentDate.getFullYear() - loanDateObj.getFullYear();
  const monthsDiff = currentDate.getMonth() - loanDateObj.getMonth();
  
  let completedMonths = yearsDiff * 12 + monthsDiff;
  
  // If the current day of the month is less than the loan day of the month,
  // then the month is not yet complete.
  if (currentDate.getDate() < loanDateObj.getDate()) {
    completedMonths -= 1;
  }
  
  return Math.max(0, completedMonths);
};

export const calculateTotalInterest = (
  principalAmount: number,
  ptr: number,
  completedMonths: number
): number => {
  const monthlyInterest = calculateInterest(principalAmount, ptr);
  return monthlyInterest * completedMonths;
};

export const calculateOutstandingAmount = (
  principalAmount: number,
  totalInterest: number,
  totalPaid: number
): number => {
  const outstandingAmount = principalAmount + totalInterest - totalPaid;
  return Math.max(0, outstandingAmount);
};


export const calculateMonthlyInterest = (
  principalAmount: number,
  ptr: number
): number => {
  return (principalAmount * ptr) / 100;
};

export const calculateTotalMonths = (
  years: number,
  months: number,
  days: number
): number => {
  return (years * 12) + months + (days / 30);
};

export const calculateTotalInterestCalc = (
  principalAmount: number,
  ptr: number,
  years: number,
  months: number,
  days: number
): number => {
  const totalMonths = calculateTotalMonths(years, months, days);
  return calculateMonthlyInterest(principalAmount, ptr) * totalMonths;
};

export const calculateTotalAmount = (
  principalAmount: number,
  totalInterest: number
): number => {
  return principalAmount + totalInterest;
};

export const calculateDurationBetweenDates = (startDateStr: string, endDateStr: string) => {
  let start = new Date(startDateStr);
  let end = new Date(endDateStr);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { years: 0, months: 0, days: 0 };
  }

  if (end < start) {
    const temp = start;
    start = end;
    end = temp;
  }

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  // Village math: always borrow 30 days
  if (days < 0) {
    months -= 1;
    days += 30;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return { years, months, days };
};
