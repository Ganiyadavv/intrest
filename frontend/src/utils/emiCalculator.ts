export interface EMIInput {
  principal: number;
  annualInterestRate: number;
  years: number;
  additionalMonths: number;
}

export interface EMIResult {
  monthlyEMI: number;
  principal: number;
  totalInterest: number;
  totalRepayment: number;
  totalMonths: number;
  years: number;
  additionalMonths: number;
}

/**
 * Calculates Equated Monthly Installment (EMI) for a loan.
 *
 * Formula:
 * EMI = P × r × (1 + r)^n / ((1 + r)^n − 1)
 *
 * Where:
 * P = Principal amount
 * r = Monthly interest rate (annualInterestRate / 12 / 100)
 * n = Total number of monthly instalments ((years * 12) + additionalMonths)
 *
 * When interest rate is 0:
 * EMI = principal / totalMonths
 */
export const calculateEMI = (input: EMIInput): EMIResult => {
  const { principal, annualInterestRate, years, additionalMonths } = input;

  const totalMonths = Math.floor(years) * 12 + Math.floor(additionalMonths);

  if (totalMonths <= 0) {
    throw new Error('Total loan tenure must be at least 1 month.');
  }

  if (principal <= 0) {
    throw new Error('Loan amount must be greater than 0.');
  }

  if (annualInterestRate < 0) {
    throw new Error('Interest rate must be 0 or greater.');
  }

  // Zero interest rate case
  if (annualInterestRate === 0) {
    const monthlyEMI = principal / totalMonths;
    const totalRepayment = principal;
    const totalInterest = 0;

    return {
      monthlyEMI,
      principal,
      totalInterest,
      totalRepayment,
      totalMonths,
      years,
      additionalMonths,
    };
  }

  // Monthly interest rate as decimal
  const monthlyRate = annualInterestRate / 12 / 100;

  // factor = (1 + r)^n
  const factor = Math.pow(1 + monthlyRate, totalMonths);

  // EMI = P * r * (1 + r)^n / ((1 + r)^n - 1)
  const monthlyEMI = (principal * monthlyRate * factor) / (factor - 1);
  const totalRepayment = monthlyEMI * totalMonths;
  const totalInterest = Math.max(0, totalRepayment - principal);

  return {
    monthlyEMI,
    principal,
    totalInterest,
    totalRepayment,
    totalMonths,
    years,
    additionalMonths,
  };
};

