import { useState } from 'react';
import { Box, Button, Card, CardContent, Divider, Grid, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import TokenIcon from './TokenIcon';

export type LiquidityCardProps = {
  account: string | null;
  tiaBalance: string;
  ytkBalance: string;
  isApproved: boolean;
  onConnect: () => Promise<void>;
  onApproveYtk: () => Promise<void>;
  onAddLiquidityEth: (ytkAmount: string, tiaAmount: string) => Promise<void>;
};

export default function LiquidityCard({ account, tiaBalance, ytkBalance, isApproved, onConnect, onApproveYtk, onAddLiquidityEth }: LiquidityCardProps) {
  const [ytkAmt, setYtkAmt] = useState('');
  const [tiaAmt, setTiaAmt] = useState('');

  const canSupply = !!ytkAmt && !!tiaAmt && Number(ytkAmt) > 0 && Number(tiaAmt) > 0;

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
            <Typography variant="caption" color="text.secondary">Amount (YTK)</Typography>
            <TextField fullWidth placeholder="0" value={ytkAmt} onChange={e=>setYtkAmt(e.target.value)}
              InputProps={{ endAdornment: <InputAdornment position='end'><TokenIcon symbol='YTK' size={20} sx={{ mr: 1 }} /> YTK</InputAdornment> }} />
            <Grid container justifyContent="space-between"><Grid item><Typography variant="caption" color="text.secondary">Balance: {ytkBalance}</Typography></Grid></Grid>
          </Box>

          {/* Token B (TIA) */}
          <Box>
            <Typography variant="caption" color="text.secondary">Amount (TIA)</Typography>
            <TextField fullWidth placeholder="0" value={tiaAmt} onChange={e=>setTiaAmt(e.target.value)}
              InputProps={{ endAdornment: <InputAdornment position='end'><TokenIcon symbol='TIA' size={20} sx={{ mr: 1 }} /> TIA</InputAdornment> }} />
            <Grid container justifyContent="space-between"><Grid item><Typography variant="caption" color="text.secondary">Balance: {tiaBalance}</Typography></Grid></Grid>
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


