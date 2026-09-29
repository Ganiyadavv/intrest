export const formatCurrency = (amount: number | string | undefined | null): string => {
  if (amount === undefined || amount === null) return '₹0.00';
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return '₹0.00';
  
  return `₹${numAmount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};
