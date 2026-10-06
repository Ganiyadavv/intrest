export type CompoundInterestInput = {
    principal: number;
    annualRate: number;
    years: number;
    months: number;
    days: number;
    compoundsPerYear: number;
};

export type CompoundInterestResult = {
    principal: number;
    compoundInterest: number;
    totalAmount: number;
    timeInYears: number;
};

export const calculateCompoundInterest = (input: CompoundInterestInput): CompoundInterestResult => {
    const { principal, annualRate, years, months, days, compoundsPerYear } = input;

    // Convert rate to decimal
    const r = annualRate / 100;

    // Convert duration to years
    // Time in Years = Years + Months / 12 + Days / 365
    const timeInYears = years + (months / 12) + (days / 365);

    // Apply the correct compounding frequency
    const n = compoundsPerYear;
    
    // Formula: A = P(1 + r/n)^(n*t)
    let totalAmount = 0;
    
    if (timeInYears > 0) {
        totalAmount = principal * Math.pow(1 + (r / n), n * timeInYears);
    } else {
        totalAmount = principal;
    }

    // Calculate compound interest: CI = A - P
    const compoundInterest = totalAmount - principal;

    return {
        principal,
        compoundInterest,
        totalAmount,
        timeInYears
    };
};
