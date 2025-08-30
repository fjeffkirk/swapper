import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Button, Card, CardContent, Divider, IconButton, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import { usePrivy } from '@privy-io/react-auth';
import { useAccount } from 'wagmi';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import TokenIcon from './TokenIcon';
import TokenSelect from './TokenSelect';
import {
  formatBalanceForSwap,
  calculateMinReceived,
  SLIPPAGE_PRESETS,
  SLIPPAGE_LIMITS,
  SWAP_CONSTANTS,
  type TokenSymbol
} from '../utils';

export type SwapCardProps = {
  tiaBalance: string;
  wtiaBalance: string;
  ytkBalance: string;
  getQuote: (sellToken: TokenSymbol, amount: string) => Promise<string>;
  onSwapEthToYtk: (tia: string, minReceived: string) => Promise<void>;
  onSwapYtkToEth: (ytk: string, minReceived: string) => Promise<void>;
  isSwapping?: boolean;
};

export default function SwapCard({ tiaBalance, wtiaBalance, ytkBalance, getQuote, onSwapEthToYtk, onSwapYtkToEth, isSwapping = false }: SwapCardProps) {
  const [sellToken, setSellToken] = useState<TokenSymbol>('TIA');
  const [amount, setAmount] = useState<string>('');

  const { authenticated, login } = usePrivy();
  const { address } = useAccount();
  const isConnected = Boolean(authenticated && address);

  const canSwap = useMemo(() => {
    if (!amount) return false;
    const amountNum = Number(amount);
    return !isNaN(amountNum) && amountNum > 0 && amountNum >= SWAP_CONSTANTS.MIN_SWAP_AMOUNT;
  }, [amount]);

  const onSwap = async () => {
    if (!canSwap) {
      if (amount && Number(amount) < SWAP_CONSTANTS.MIN_SWAP_AMOUNT) {
        alert(`Amount too small. Minimum amount is ${SWAP_CONSTANTS.MIN_SWAP_AMOUNT}`);
      }
      return;
    }

    let minAmount: string;
    if (minReceived === 'Calculated on swap') {
      // When quotes are unavailable, calculate min received based on slippage
      const amountNum = Number(amount);
      minAmount = calculateMinReceived(amountNum, effectiveSlippagePct, SWAP_CONSTANTS.MIN_REASONABLE_AMOUNT);
    } else {
      minAmount = minReceived || '0';
    }

    if (sellToken === 'TIA') await onSwapEthToYtk(amount, minAmount);
    else await onSwapYtkToEth(amount, minAmount);
    setAmount('');
    setQuote('');
  };

  const buyToken = sellToken === 'TIA' ? 'YTK' : 'TIA';
  const balanceMap: Record<TokenSymbol, string> = { TIA: tiaBalance, WTIA: wtiaBalance, YTK: ytkBalance };
  const sellBalance = sellToken === 'TIA' ? balanceMap.TIA : balanceMap.YTK;
  const buyBalance  = buyToken === 'TIA' ? balanceMap.TIA : balanceMap.YTK;
  const sellBalanceDisplay = formatBalanceForSwap(sellBalance);
  const buyBalanceDisplay = formatBalanceForSwap(buyBalance);

  const [quote, setQuote] = useState<string>('');
  const [isLoadingQuote, setIsLoadingQuote] = useState<boolean>(false);
  const [quoteError, setQuoteError] = useState<string>('');

  const refreshQuote = useCallback(async (nextAmount: string, nextSell: TokenSymbol) => {
    if (!nextAmount || Number(nextAmount) <= 0) {
      setQuote('');
      setQuoteError('');
      setIsLoadingQuote(false);
      return;
    }

    setIsLoadingQuote(true);
    setQuoteError('');
    try {
      const q = await getQuote(nextSell, nextAmount);
      if (q && !q.includes('not deployed') && !q.includes('No liquidity') && !q.includes('Quote unavailable') && !q.includes('Invalid contract') && !q.includes('temporarily unavailable')) {
        setQuote(q);
        setQuoteError('');
      } else {
        setQuote('');
        setQuoteError(q || 'Unable to get quote');
      }
    } catch (error) {
      console.error('Error fetching quote:', error);
      setQuote('');
      setQuoteError('Failed to fetch quote');
    } finally {
      setIsLoadingQuote(false);
    }
  }, [getQuote]);

  // Keep quote in sync whenever inputs change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      refreshQuote(amount, sellToken);
    }, SWAP_CONSTANTS.QUOTE_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [amount, sellToken, refreshQuote]);

  const [slippagePct, setSlippagePct] = useState<number>(SLIPPAGE_PRESETS[1]); // Default to 1%
  const [customSlippage, setCustomSlippage] = useState<string>('');
  const [useCustomSlippage, setUseCustomSlippage] = useState<boolean>(false);

  // Get the effective slippage percentage (preset or custom)
  const effectiveSlippagePct = useMemo(() => {
    if (useCustomSlippage && customSlippage) {
      const customValue = parseFloat(customSlippage);
      if (!isNaN(customValue) && customValue > 0 && customValue <= SLIPPAGE_LIMITS.MAX) {
        return customValue;
      }
    }
    return slippagePct;
  }, [useCustomSlippage, customSlippage, slippagePct]);

  const minReceived = useMemo(() => {
    const q = Number(quote);
    if (!isFinite(q) || q <= 0 || !quote) {
      // If no quote but we know pair exists, show that min will be calculated
      if (quoteError && quoteError.includes('temporarily unavailable')) {
        return 'Calculated on swap';
      }
      return '';
    }
    const min = q * (1 - effectiveSlippagePct / 100);
    return formatBalanceForSwap(String(min));
  }, [quote, effectiveSlippagePct, quoteError]);

  const estimatedBuyAmount = useMemo(() => {
    if (!quote || Number(quote) <= 0) return '';
    return formatBalanceForSwap(quote);
  }, [quote]);

  return (
    <Card sx={{ maxWidth: 500, width: '100%', bgcolor: 'background.paper', boxShadow: '0 12px 40px rgba(0,0,0,0.45)', borderRadius: 3 }}>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6" fontWeight={700}>Swap</Typography>

          <Box>
            <Typography variant="caption" color="text.secondary">Sell</Typography>
            <TextField
              fullWidth
              value={amount}
              onChange={(e)=>{ const v = (e.target as HTMLInputElement).value; setAmount(v); }}
              placeholder="0"
              error={!!(amount && !canSwap)}
              helperText={amount && !canSwap ? "Minimum amount is 0.000001" : ""}
              InputProps={{
                endAdornment: <InputAdornment position="end"><TokenSelect value={sellToken} onChange={(v)=>{ setSellToken(v === 'YTK' ? 'YTK' : 'TIA'); setQuote(''); setQuoteError(''); }} /></InputAdornment>
              }}
            />
            <Typography variant="caption" color="text.secondary">Balance: {sellBalanceDisplay}</Typography>
          </Box>

          <Stack alignItems="center"><IconButton size="small" onClick={() => { const next: 'TIA'|'YTK' = sellToken === 'TIA' ? 'YTK' : 'TIA'; setSellToken(next); setQuote(''); setQuoteError(''); }} aria-label="switch tokens"><ArrowDownwardIcon /></IconButton></Stack>

          <Box>
            <Typography variant="caption" color="text.secondary">Buy (Estimated)</Typography>
            <TextField
              fullWidth
              value={
                isLoadingQuote ? 'Loading...' :
                quoteError ? quoteError :
                estimatedBuyAmount
              }
              placeholder="0"
              disabled
              error={!!quoteError}
              InputProps={{
                endAdornment: <InputAdornment position="end">
                  <TokenIcon symbol={buyToken as any} size={20} sx={{ mr: 1 }} /> {buyToken}
                </InputAdornment>
              }}
            />
            {quoteError && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                {quoteError}
                {quoteError.includes('No liquidity pool') && (
                  <Typography variant="caption" color="info.main" sx={{ mt: 0.5, display: 'block' }}>
                    Check deploy-guide.md for setup instructions
                  </Typography>
                )}
                {quoteError.includes('temporarily unavailable') && (
                  <Typography variant="caption" color="warning.main" sx={{ mt: 0.5, display: 'block' }}>
                    ⚠️ Pair has liquidity but quotes are unavailable. You can still try swapping with custom slippage.
                  </Typography>
                )}
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary">Balance: {buyBalanceDisplay}</Typography>
          </Box>

          <Divider />

          {/* Slippage + Minimum received */}
          <Box>
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
              <Typography variant="body2" fontWeight={600}>Slippage Tolerance</Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                {SLIPPAGE_PRESETS.map(p => (
                  <Button
                    key={p}
                    size="small"
                    variant={(!useCustomSlippage && slippagePct===p) ? 'contained':'outlined'}
                    onClick={() => {
                      setSlippagePct(p);
                      setUseCustomSlippage(false);
                      setCustomSlippage('');
                    }}
                    sx={{ minWidth: 0, px: 1.25 }}
                  >
                    {p}%
                  </Button>
                ))}
                <TextField
                  size="small"
                  placeholder="Custom"
                  value={customSlippage}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCustomSlippage(value);
                    setUseCustomSlippage(true);
                  }}
                  onFocus={() => setUseCustomSlippage(true)}
                  InputProps={{
                    endAdornment: <Typography variant="caption">%</Typography>,
                    sx: { width: 80 }
                  }}
                  inputProps={{
                    style: { textAlign: 'center' }
                  }}
                  error={!!(useCustomSlippage && customSlippage && (isNaN(parseFloat(customSlippage)) || parseFloat(customSlippage) < SLIPPAGE_LIMITS.MIN || parseFloat(customSlippage) > SLIPPAGE_LIMITS.MAX))}
                  helperText={useCustomSlippage && customSlippage && (isNaN(parseFloat(customSlippage)) || parseFloat(customSlippage) < SLIPPAGE_LIMITS.MIN || parseFloat(customSlippage) > SLIPPAGE_LIMITS.MAX) ? `${SLIPPAGE_LIMITS.MIN}-${SLIPPAGE_LIMITS.MAX}%` : ""}
                />
              </Stack>
            </Stack>
            <Box sx={{ mt: 1, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Minimum received: <Typography component="span" variant="body2" fontWeight={600} color="text.primary">
                  {quote ? `${minReceived} ${buyToken}` : (quoteError?.includes('temporarily unavailable') ? 'Calculated on swap' : '—')}
                </Typography>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Based on {effectiveSlippagePct}% slippage tolerance
              </Typography>
            </Box>
          </Box>

          <Stack spacing={1} width="100%">
            <Button
              variant="contained"
              size="large"
              disabled={isConnected ? !canSwap || isSwapping : false}
              onClick={() => { if (!isConnected) login(); else onSwap(); }}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              {isSwapping ? 'Swapping...' : isConnected ? 'Swap' : 'Connect Wallet'}
            </Button>

            {isConnected && canSwap && quoteError?.includes('temporarily unavailable') && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => { if (!isConnected) login(); else onSwap(); }}
                sx={{ textTransform: 'none', fontSize: '0.875rem' }}
              >
                Force Swap (Skip Quote Check)
              </Button>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}


