const rupeesToPaise = (rupees) => {
  if (typeof rupees !== 'number') {
    return 0;
  }
  return Math.round(rupees * 100);
};

const paiseToRupees = (paise) => {
  if (typeof paise !== 'number') {
    return 0;
  }
  return paise / 100;
};

const formatCurrency = (amount, unit = 'paise') => {
  let amountInRupees = unit === 'paise' ? paiseToRupees(amount) : amount;

  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(amountInRupees);
};

const parseCurrencyInput = (input) => {
  if (typeof input !== 'string') {
    return 0;
  }
  // Remove currency symbols and commas
  const numericString = input.replace(/[^\d.-]/g, '');
  const rupees = parseFloat(numericString);
  return rupeesToPaise(rupees);
};

module.exports = {
  rupeesToPaise,
  paiseToRupees,
  formatCurrency,
  parseCurrencyInput,
};
