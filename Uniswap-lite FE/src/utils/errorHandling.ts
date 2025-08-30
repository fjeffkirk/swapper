/**
 * Centralized error handling utilities
 */

import { ERROR_MESSAGES } from './constants';

/**
 * Extracts user-friendly error message from various error types
 * @param error - The error object
 * @returns User-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Check for specific error patterns
    if (message.includes('call revert exception') ||
        message.includes('CALL_EXCEPTION') ||
        message.includes('missing revert data')) {
      return ERROR_MESSAGES.TRANSACTION_REVERT;
    }

    if (message.includes('INSUFFICIENT_FUNDS')) {
      return ERROR_MESSAGES.INSUFFICIENT_FUNDS;
    }

    if (message.includes('network')) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }

    if (message.includes('invalid address')) {
      return ERROR_MESSAGES.INVALID_ADDRESS;
    }

    // Return the original message if it's already user-friendly
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unknown error occurred';
}

/**
 * Handles swap transaction errors with appropriate user feedback
 * @param error - The error from the swap transaction
 * @returns Promise that always rejects with user-friendly message
 */
export async function handleSwapError(error: unknown): Promise<never> {
  const message = getErrorMessage(error);

  // Log the original error for debugging
  console.error('Swap failed:', error);

  // Show user-friendly alert
  alert(`Swap failed: ${message}`);

  // Re-throw for component handling
  throw new Error(message);
}

/**
 * Handles approval transaction errors
 * @param error - The error from the approval transaction
 * @returns Promise that always rejects with user-friendly message
 */
export async function handleApprovalError(error: unknown): Promise<never> {
  const message = getErrorMessage(error);

  console.error('Approval failed:', error);
  alert(`Failed to approve token spending: ${message}`);

  throw new Error(message);
}

/**
 * Handles liquidity addition errors
 * @param error - The error from the liquidity transaction
 * @returns Promise that always rejects with user-friendly message
 */
export async function handleLiquidityError(error: unknown): Promise<never> {
  const message = getErrorMessage(error);

  console.error('Liquidity addition failed:', error);
  alert(`Liquidity addition failed: ${message}`);

  throw new Error(message);
}

/**
 * Safely executes an async operation with error handling
 * @param operation - The async operation to execute
 * @param errorHandler - Custom error handler (optional)
 * @returns Result of the operation or null if failed
 */
export async function safeExecute<T>(
  operation: () => Promise<T>,
  errorHandler?: (error: unknown) => void
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    if (errorHandler) {
      errorHandler(error);
    } else {
      console.error('Operation failed:', error);
    }
    return null;
  }
}
