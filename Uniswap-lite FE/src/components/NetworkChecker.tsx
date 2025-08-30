import { Alert } from '@mui/material';
import { usePrivy } from '@privy-io/react-auth';
import { useChainId } from 'wagmi';
import { NETWORK_INFO } from '../config/privy';

export default function NetworkChecker() {
  const id = useChainId();
  const { ready, authenticated } = usePrivy();
  if (!ready || !authenticated) return null;
  if (Number(id) === Number(NETWORK_INFO.chainId)) return null;
  return <Alert severity='warning'>Wrong network. Please switch to {NETWORK_INFO.chainName} ({NETWORK_INFO.chainId}).</Alert>;
}
