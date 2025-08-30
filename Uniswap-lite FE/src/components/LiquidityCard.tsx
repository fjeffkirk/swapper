import { useState } from 'react';
import { Box, Button, Card, CardContent, CircularProgress, Divider, InputAdornment, Skeleton, Stack, TextField, Typography } from '@mui/material';
import TokenIcon from './TokenIcon';

export type LiquidityCardProps = {
  account: string | null;
  tiaBalance: string;
  ytkBalance: string;
  isApproved: boolean;
  onConnect: () => Promise<void>;
  onApproveYtk: () => Promise<void>;
  onAddLiquidityEth: (ytkAmount: string, tiaAmount: string) => Promise<void>;
  onCalculateLiquidityAmount: (tokenIn: 'TIA' | 'YTK', amountIn: string) => Promise<{ tiaAmount: string; ytkAmount: string } | null>;
};

export default function LiquidityCard({ account, tiaBalance, ytkBalance, isApproved, onConnect, onApproveYtk, onAddLiquidityEth, onCalculateLiquidityAmount }: LiquidityCardProps) {
  const [ytkAmt, setYtkAmt] = useState('');
  const [tiaAmt, setTiaAmt] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);

  // Format balance to prevent excessive decimal places
  const formatBalance = (balance: string) => {
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
  };

  const canSupply = !!ytkAmt && !!tiaAmt && Number(ytkAmt) > 0 && Number(tiaAmt) > 0;

  const handleTiaChange = async (value: string) => {
    setTiaAmt(value);

    if (value && Number(value) > 0) {
      setIsCalculating(true);
      try {
        const result = await onCalculateLiquidityAmount('TIA', value);
        if (result) {
          setYtkAmt(result.ytkAmount);
        }
      } catch (error) {
        console.error('Failed to calculate required YTK amount:', error);
      } finally {
        setIsCalculating(false);
      }
    } else {
      setYtkAmt('');
    }
  };

  const handleYtkChange = async (value: string) => {
    setYtkAmt(value);

    if (value && Number(value) > 0) {
      setIsCalculating(true);
      try {
        const result = await onCalculateLiquidityAmount('YTK', value);
        if (result) {
          setTiaAmt(result.tiaAmount);
        }
      } catch (error) {
        console.error('Failed to calculate required TIA amount:', error);
      } finally {
        setIsCalculating(false);
      }
    } else {
      setTiaAmt('');
    }
  };

  const handleSupply = async () => {
    if (!canSupply) return;
    await onAddLiquidityEth(ytkAmt, tiaAmt);
    setYtkAmt('');
    setTiaAmt('');
  };

  return (
    <Card sx={{ maxWidth: 500, width: '100%', bgcolor: 'background.paper', boxShadow: '0 12px 40px rgba(0,0,0,0.45)', borderRadius: 3 }}>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6" fontWeight={700}>Add Liquidity</Typography>

          {/* Token A (YTK) */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="caption" color="text.secondary">Amount (YTK)</Typography>
              {isCalculating && (
                <CircularProgress
                  size={14}
                  thickness={4}
                  sx={{ color: 'primary.main', opacity: 0.7 }}
                />
              )}
            </Box>
            <TextField
              fullWidth
              placeholder="0"
              value={ytkAmt}
              onChange={e => handleYtkChange(e.target.value)}
              InputProps={{
                endAdornment: <InputAdornment position='end'><TokenIcon symbol='YTK' size={20} sx={{ mr: 1 }} /> YTK</InputAdornment>
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="caption" color="text.secondary">Balance: {formatBalance(ytkBalance)}</Typography>
              {ytkAmt ? (
                <Typography variant="caption" color="text.secondary">Required: {formatBalance(ytkAmt)} YTK</Typography>
              ) : isCalculating ? (
                <Skeleton variant="text" width={80} height={16} />
              ) : null}
            </Box>
          </Box>

          {/* Token B (TIA) */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="caption" color="text.secondary">Amount (TIA)</Typography>
              {isCalculating && (
                <CircularProgress
                  size={14}
                  thickness={4}
                  sx={{ color: 'primary.main', opacity: 0.7 }}
                />
              )}
            </Box>
            <TextField
              fullWidth
              placeholder="0"
              value={tiaAmt}
              onChange={e => handleTiaChange(e.target.value)}
              InputProps={{
                endAdornment: <InputAdornment position='end'><TokenIcon symbol='TIA' size={20} sx={{ mr: 1 }} /> TIA</InputAdornment>
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="caption" color="text.secondary">Balance: {formatBalance(tiaBalance)}</Typography>
              {tiaAmt ? (
                <Typography variant="caption" color="text.secondary">Required: {formatBalance(tiaAmt)} TIA</Typography>
              ) : isCalculating ? (
                <Skeleton variant="text" width={80} height={16} />
              ) : null}
            </Box>
          </Box>

          <Divider />

          {account ? (
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" fullWidth disabled={isApproved} onClick={onApproveYtk} sx={{ textTransform: 'none', fontWeight: 700 }}>Approve YTK</Button>
              <Button variant="contained" fullWidth disabled={!canSupply} onClick={handleSupply} sx={{ textTransform: 'none', fontWeight: 700 }}>Supply</Button>
            </Stack>
          ) : (
            <Button variant="contained" size="large" onClick={onConnect} sx={{ textTransform: 'none', fontWeight: 700 }}>Connect Wallet</Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}


