/**
 * Application constants and configuration values
 */

// Swap and liquidity constants
export const SWAP_CONSTANTS = {
  MIN_SWAP_AMOUNT: 1e-6, // Minimum swap amount to avoid precision issues
  MIN_REASONABLE_AMOUNT: 1e-18, // Minimum reasonable amount for contract calls
  GAS_BUFFER_PERCENT: 20, // Gas buffer percentage
  QUOTE_DEBOUNCE_MS: 300, // Debounce time for quote requests
  BALANCE_REFRESH_INTERVAL_MS: 10000, // Balance refresh interval
  DEADLINE_BUFFER_SECONDS: 3600, // Swap deadline buffer
} as const;

// Slippage tolerance presets
export const SLIPPAGE_PRESETS = [0.5, 1, 2] as const;
export const SLIPPAGE_LIMITS = {
  MIN: 0.1,
  MAX: 50,
} as const;

// Uniswap V2 constants
export const UNISWAP_CONSTANTS = {
  FEE_NUMERATOR: 997n,
  FEE_DENOMINATOR: 1000n,
} as const;

// Error messages
export const ERROR_MESSAGES = {
  INVALID_AMOUNT: 'Invalid amount',
  INSUFFICIENT_FUNDS: 'Insufficient funds for gas',
  TRANSACTION_REVERT: 'Transaction would revert - check contract state or parameters',
  NETWORK_ERROR: 'Network error',
  INVALID_ADDRESS: 'Invalid contract address',
  QUOTE_UNAVAILABLE: 'Quote unavailable',
  NO_LIQUIDITY: 'No liquidity',
  ROUTER_NOT_DEPLOYED: 'Router not deployed',
  WTIA_NOT_DEPLOYED: 'WTIA not deployed',
  INVALID_AMOUNT_FORMAT: 'Invalid amount format',
} as const;

// Token decimals (default to 18 if not specified)
export const DEFAULT_DECIMALS = 18;

// Approval amounts
export const APPROVAL_AMOUNTS = {
  LARGE: '1000000', // 1M tokens for large approvals
} as const;
