/**
 * Format currency in NPR format with thousand separators
 * @param amount - The amount to format
 * @returns Formatted currency string (e.g., "NPR 100,000")
 */
export const formatCurrencyNPR = (amount: number): string => {
  return `NPR ${amount.toLocaleString('en-NP')}`;
};

/**
 * Format currency short form (e.g., 100K, 1M)
 * @param amount - The amount to format
 * @returns Short formatted currency string
 */
export const formatCurrencyShort = (amount: number): string => {
  if (amount >= 1000000) {
    return `NPR ${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `NPR ${(amount / 1000).toFixed(0)}K`;
  }
  return `NPR ${amount}`;
};
