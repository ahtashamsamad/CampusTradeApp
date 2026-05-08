export const formatCurrency = (amount: number | string) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return 'Rs 0';
  return `Rs ${Math.round(num).toLocaleString('en-PK')}`;
};
