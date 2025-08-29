import { Button, Tooltip } from '@mui/material';
import { usePrivy } from '@privy-io/react-auth';
import { useAccount } from 'wagmi';

export default function WalletButton() {
  const { login, logout, ready, authenticated } = usePrivy();
  const { address } = useAccount();

  if (!ready) return <Button variant='contained' disabled>Loading...</Button>;
  if (!authenticated) return <Button variant='contained' onClick={() => login()} sx={{ textTransform: 'none', fontWeight: 700 }}>Connect</Button>;
  return (
    <Tooltip title='Click to disconnect'>
      <Button variant='outlined' onClick={() => logout()} sx={{ textTransform: 'none', fontWeight: 700 }}>
        {address?.slice(0,6)}…{address?.slice(-4)}
      </Button>
    </Tooltip>
  );
}
