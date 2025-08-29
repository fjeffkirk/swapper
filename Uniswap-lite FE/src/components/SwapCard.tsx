import { useMemo, useState } from 'react';
import { Box, Button, Card, CardContent, Divider, IconButton, InputAdornment, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { usePrivy } from '@privy-io/react-auth';
import { useAccount } from 'wagmi';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import TokenIcon from './TokenIcon';
import TokenSelect from './TokenSelect';

function formatBalance(value: string): string {
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

export type SwapCardProps = {
  account: string | null;
  tiaBalance: string;
  wtiaBalance: string;
  ytkBalance: string;
  getQuote: (sellToken: 'TIA'|'YTK', amount: string) => Promise<string>;
  onConnect: () => Promise<void>;
  onSwapEthToYtk: (tia: string) => Promise<void>;
  onSwapYtkToEth: (ytk: string) => Promise<void>;
};

export default function SwapCard({ account, tiaBalance, wtiaBalance, ytkBalance, getQuote, onConnect, onSwapEthToYtk, onSwapYtkToEth }: SwapCardProps) {
  const [sellToken, setSellToken] = useState<'TIA'|'YTK'>('TIA');
  const [amount, setAmount] = useState<string>('');

  const { authenticated, login } = usePrivy();
  const { address } = useAccount();
  const isConnected = Boolean(authenticated && address);

  const canSwap = useMemo(() => !!amount && Number(amount) > 0, [amount]);

  const onSwap = async () => {
    if (!canSwap) return;
    if (sellToken === 'TIA') await onSwapEthToYtk(amount);
    else await onSwapYtkToEth(amount);
    setAmount('');
  };

  const buyToken = sellToken === 'TIA' ? 'YTK' : 'TIA';
  const balanceMap: Record<'TIA'|'WTIA'|'YTK', string> = { TIA: tiaBalance, WTIA: wtiaBalance, YTK: ytkBalance } as any;
  const sellBalance = sellToken === 'TIA' ? balanceMap.TIA : balanceMap.YTK;
  const buyBalance  = buyToken === 'TIA' ? balanceMap.TIA : balanceMap.YTK;
  const sellBalanceDisplay = formatBalance(sellBalance);
  const buyBalanceDisplay = formatBalance(buyBalance);

  const [quote, setQuote] = useState<string>('');
  const refreshQuote = async (nextAmount: string, nextSell: 'TIA'|'YTK') => {
    const q = await getQuote(nextSell, nextAmount);
    setQuote(q);
  };

  const [slippagePct, setSlippagePct] = useState<number>(1);
  const minReceived = useMemo(() => {
    const q = Number(quote);
    if (!isFinite(q) || q <= 0) return '';
    const min = q * (1 - (slippagePct || 0) / 100);
    return formatBalance(String(min));
  }, [quote, slippagePct]);

  return (
    <Card sx={{ maxWidth: 500, width: '100%', bgcolor: 'background.paper', boxShadow: '0 12px 40px rgba(0,0,0,0.45)', borderRadius: 3 }}>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6" fontWeight={700}>Swap</Typography>

          <Box>
            <Typography variant="caption" color="text.secondary">Sell</Typography>
            <TextField fullWidth value={amount} onChange={async e=>{ const v = e.target.value; setAmount(v); await refreshQuote(v, sellToken); }} placeholder="0"
              InputProps={{ endAdornment: <InputAdornment position="end"><TokenSelect value={sellToken} onChange={(v)=>setSellToken(v)} /></InputAdornment> }} />
            <Typography variant="caption" color="text.secondary">Balance: {sellBalanceDisplay}</Typography>
          </Box>

          <Stack alignItems="center"><IconButton size="small" onClick={async () => { const next = sellToken === 'TIA' ? 'YTK' : 'TIA'; setSellToken(next); await refreshQuote(amount, next); }} aria-label="switch tokens"><ArrowDownwardIcon /></IconButton></Stack>

          <Box>
            <Typography variant="caption" color="text.secondary">Buy</Typography>
            <TextField fullWidth value={quote ? `${buyToken} ≈ ${formatBalance(quote)}` : buyToken} disabled InputProps={{ endAdornment: <InputAdornment position="end"><TokenIcon symbol={buyToken as any} size={20} sx={{ mr: 1 }} /> {buyToken}</InputAdornment> }} />
            <Typography variant="caption" color="text.secondary">Balance: {buyBalanceDisplay}</Typography>
          </Box>

          <Divider />

          {/* Slippage + Quote details */}
          <Box>
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
              <Typography variant="caption" color="text.secondary">Slippage</Typography>
              <Stack direction="row" spacing={1}>
                {[0.5, 1, 2].map(p => (
                  <Button key={p} size="small" variant={slippagePct===p? 'contained':'outlined'} onClick={()=>setSlippagePct(p)} sx={{ minWidth: 0, px: 1.25 }}>
                    {p}%
                  </Button>
                ))}
              </Stack>
            </Stack>
            {quote && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Est.: {formatBalance(quote)} {buyToken} · Min received ({slippagePct}%): {minReceived} {buyToken}
              </Typography>
            )}
          </Box>

          <Button
            variant="contained"
            size="large"
            disabled={isConnected ? !canSwap : false}
            onClick={() => { if (!isConnected) login(); else onSwap(); }}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            {isConnected ? 'Swap' : 'Connect Wallet'}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}


