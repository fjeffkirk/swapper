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
  onConnect: () => Promise<void>;
  onSwapEthToYtk: (tia: string) => Promise<void>;
  onSwapYtkToEth: (ytk: string) => Promise<void>;
};

export default function SwapCard({ account, tiaBalance, wtiaBalance, ytkBalance, onConnect, onSwapEthToYtk, onSwapYtkToEth }: SwapCardProps) {
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

  return (
    <Card sx={{ maxWidth: 500, width: '100%', bgcolor: 'background.paper', boxShadow: '0 12px 40px rgba(0,0,0,0.45)', borderRadius: 3 }}>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6" fontWeight={700}>Swap</Typography>

          <Box>
            <Typography variant="caption" color="text.secondary">Sell</Typography>
            <TextField fullWidth value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0"
              InputProps={{ endAdornment: <InputAdornment position="end"><TokenSelect value={sellToken} onChange={(v)=>setSellToken(v)} /></InputAdornment> }} />
            <Typography variant="caption" color="text.secondary">Balance: {sellBalanceDisplay}</Typography>
          </Box>

          <Stack alignItems="center"><IconButton size="small" onClick={() => setSellToken(sellToken === 'TIA' ? 'YTK' : 'TIA')} aria-label="switch tokens"><ArrowDownwardIcon /></IconButton></Stack>

          <Box>
            <Typography variant="caption" color="text.secondary">Buy</Typography>
            <TextField fullWidth value={buyToken} disabled InputProps={{ endAdornment: <InputAdornment position="end"><TokenIcon symbol={buyToken as any} size={20} sx={{ mr: 1 }} /> {buyToken}</InputAdornment> }} />
            <Typography variant="caption" color="text.secondary">Balance: {buyBalanceDisplay}</Typography>
          </Box>

          <Divider />

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


