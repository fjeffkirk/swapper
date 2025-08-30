/**
 * Utility functions for formatting numbers, balances, and other data
 */

/**
 * Formats a balance string for display with proper decimal handling
 * @param balance - The balance string to format
 * @returns Formatted balance string
 */
export function formatBalance(balance: string): string {
  if (!balance || balance === '0') return '0';

  const num = parseFloat(balance);
  if (isNaN(num)) return balance;

  // For very small numbers (< 0.000001), use scientific notation
  if (num > 0 && num < 0.000001) {
    return num.toExponential(3);
  }

  // For very large numbers (> 1 million), use abbreviated format
  if (num > 1000000) {
    return (num / 1000000).toFixed(2) + 'M';
  }

  // For regular numbers, limit to 6 decimal places maximum
  // Remove trailing zeros and unnecessary decimal point
  let formatted = num.toFixed(6);
  formatted = formatted.replace(/\.?0+$/, '');
  return formatted || '0';
}

/**
 * Formats a balance for swap display (different from liquidity display)
 * @param value - The balance value to format
 * @returns Formatted balance string for swap UI
 */
export function formatBalanceForSwap(value: string): string {
  const num = Number(value);
  if (!isFinite(num)) return value;
  if (num === 0) return '0';
  if (Math.abs(num) >= 1) {
    // Show up to 2 decimals for values >= 1, trim trailing zeros
    return num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }
  // For small values, show up to 6 decimals, trimming trailing zeros
  return num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 6 });
}

/**
 * Formats gas limit with a buffer for safety
 * @param gasEstimate - The estimated gas
 * @param bufferPercent - Buffer percentage (default 20%)
 * @returns Gas limit with buffer
 */
export function addGasBuffer(gasEstimate: bigint, bufferPercent: number = 20): bigint {
  return gasEstimate * BigInt(100 + bufferPercent) / 100n;
}

/**
 * Validates if an amount is within acceptable range for swaps
 * @param amount - Amount to validate
 * @param minAmount - Minimum allowed amount (default 1e-6)
 * @returns Validation result
 */
export function validateSwapAmount(amount: string, minAmount: number = 1e-6): { isValid: boolean; error?: string } {
  const num = Number(amount);
  if (isNaN(num) || num <= 0) {
    return { isValid: false, error: 'Invalid amount' };
  }
  if (num < minAmount) {
    return { isValid: false, error: `Amount too small. Minimum amount is ${minAmount}` };
  }
  return { isValid: true };
}

/**
 * Calculates minimum received amount based on slippage tolerance
 * @param amount - Original amount
 * @param slippagePercent - Slippage percentage (0-100)
 * @param minReasonableAmount - Minimum reasonable amount to avoid parsing issues (default 1e-18)
 * @returns Minimum received amount
 */
export function calculateMinReceived(amount: number, slippagePercent: number, minReasonableAmount: number = 1e-18): string {
  if (isNaN(amount) || amount <= 0) return '0';
  const minReceiveAmount = amount * (1 - slippagePercent / 100);
  return Math.max(minReceiveAmount, minReasonableAmount).toString();
}

/**
 * Safely parses an amount for contract interaction
 * @param amount - Amount string to parse
 * @param decimals - Number of decimals for the token
 * @returns Parsed bigint or null if invalid
 */
export function safeParseAmount(amount: string, decimals: number): bigint | null {
  try {
    if (!amount || amount.trim() === '') return null;
    const num = Number(amount);
    if (isNaN(num) || num <= 0) return null;
    return BigInt(Math.floor(num * Math.pow(10, decimals)));
  } catch {
    return null;
  }
}
