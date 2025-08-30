import { Alert, Box } from '@mui/material';
import { usePrivy } from '@privy-io/react-auth';
import { useChainId } from 'wagmi';
import { NETWORK_INFO } from '../config/privy';

export default function NetworkChecker() {
  const id = useChainId();
  const { ready, authenticated } = usePrivy();

  // Don't show network checker if not ready or not authenticated
  if (!ready || !authenticated) return null;

  // Don't show network checker if on correct network
  if (Number(id) === Number(NETWORK_INFO.chainId)) return null;

  // Check if we're in production (HTTPS)
  const isProduction = window.location.protocol === 'https:';
  const isLocalhost = window.location.hostname === 'localhost';

  return (
    <Box sx={{ mb: 2 }}>
      <Alert severity='warning'>
        Wrong network. Please switch to {NETWORK_INFO.chainName} ({NETWORK_INFO.chainId}).

        {isProduction && !isLocalhost && (
          <Box sx={{ mt: 1, fontSize: '0.875rem' }}>
            💡 Make sure your wallet is connected and you're using a Web3-compatible browser.
          </Box>
        )}
      </Alert>
    </Box>
  );
}
