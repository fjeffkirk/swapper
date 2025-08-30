import { useState } from 'react';
import { Box, Button, Card, CardContent, Divider, InputAdornment, Stack, TextField, Typography } from '@mui/material';
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
            <Typography variant="caption" color="text.secondary">
              Amount (YTK) {isCalculating && <span style={{ color: '#1976d2' }}>• Calculating...</span>}
            </Typography>
            <TextField
              fullWidth
              placeholder="0"
              value={ytkAmt}
              onChange={e => handleYtkChange(e.target.value)}
              InputProps={{
                endAdornment: <InputAdornment position='end'><TokenIcon symbol='YTK' size={20} sx={{ mr: 1 }} /> YTK</InputAdornment>
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">Balance: {ytkBalance}</Typography>
              {ytkAmt && <Typography variant="caption" color="text.secondary">Required: {ytkAmt} YTK</Typography>}
            </Box>
          </Box>

          {/* Token B (TIA) */}
          <Box>
            <Typography variant="caption" color="text.secondary">
              Amount (TIA) {isCalculating && <span style={{ color: '#1976d2' }}>• Calculating...</span>}
            </Typography>
            <TextField
              fullWidth
              placeholder="0"
              value={tiaAmt}
              onChange={e => handleTiaChange(e.target.value)}
              InputProps={{
                endAdornment: <InputAdornment position='end'><TokenIcon symbol='TIA' size={20} sx={{ mr: 1 }} /> TIA</InputAdornment>
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">Balance: {tiaBalance}</Typography>
              {tiaAmt && <Typography variant="caption" color="text.secondary">Required: {tiaAmt} TIA</Typography>}
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


