/**
 * Shared TypeScript type definitions
 */

import type { BigNumberish } from 'ethers';

// Token symbols used in the application
export type TokenSymbol = 'TIA' | 'WTIA' | 'YTK';

// Swap directions
export type SwapDirection = 'TIA_TO_YTK' | 'YTK_TO_TIA';

// Slippage tolerance type
export type SlippageTolerance = number;

// Balance type for better type safety
export type Balance = {
  raw: string;
  formatted: string;
  numeric: number;
};

// Contract addresses type
export type ContractAddresses = {
  router: string;
  wtia: string;
  ytk: string;
  factory?: string;
};

// Pool reserves type
export type PoolReserves = {
  tiaReserve: bigint;
  ytkReserve: bigint;
  totalTia: string;
  totalYtk: string;
};

// Quote result type
export type QuoteResult = {
  amount: string;
  minReceived: string;
  path: readonly [string, string];
} | null;

// Swap parameters type
export type SwapParams = {
  amountIn: BigNumberish;
  amountOutMin: BigNumberish;
  path: readonly [string, string];
  to: string;
  deadline: number;
  value?: BigNumberish;
};

// Liquidity calculation result type
export type LiquidityCalculation = {
  tiaAmount: string;
  ytkAmount: string;
} | null;

// Transaction result type
export type TransactionResult = {
  hash: string;
  wait: () => Promise<any>;
};

// Error types
export type AppError =
  | 'INVALID_AMOUNT'
  | 'INSUFFICIENT_FUNDS'
  | 'TRANSACTION_REVERT'
  | 'NETWORK_ERROR'
  | 'INVALID_ADDRESS'
  | 'QUOTE_UNAVAILABLE'
  | 'NO_LIQUIDITY'
  | 'ROUTER_NOT_DEPLOYED'
  | 'WTIA_NOT_DEPLOYED'
  | 'INVALID_AMOUNT_FORMAT';

// Component props types
export type SwapCardProps = {
  tiaBalance: string;
  wtiaBalance: string;
  ytkBalance: string;
  getQuote: (sellToken: TokenSymbol, amount: string) => Promise<string>;
  onSwapEthToYtk: (tia: string, minReceived: string) => Promise<void>;
  onSwapYtkToEth: (ytk: string, minReceived: string) => Promise<void>;
};

export type LiquidityCardProps = {
  account: string | null;
  tiaBalance: string;
  ytkBalance: string;
  isApproved: boolean;
  onConnect: () => Promise<void>;
  onApproveYtk: () => Promise<void>;
  onAddLiquidityEth: (ytkAmount: string, tiaAmount: string) => Promise<void>;
  onCalculateLiquidityAmount: (tokenIn: 'TIA' | 'YTK', amountIn: string) => Promise<LiquidityCalculation>;
};

// Hook return types
export type UseBalancesReturn = {
  tiaBalance: string;
  ytkBalance: string;
  wtiaBalance: string;
  refresh: () => Promise<void>;
  isLoading: boolean;
};

export type UseQuoteReturn = {
  quote: string;
  isLoading: boolean;
  error: string | null;
  refreshQuote: (amount: string, sellToken: TokenSymbol) => Promise<void>;
};
