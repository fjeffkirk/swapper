import { useEffect, useState } from 'react';
import { Box, Button, Typography, Alert, Chip } from '@mui/material';

export default function WalletConnectionTest() {
  const [walletStatus, setWalletStatus] = useState<{
    ethereum: boolean;
    metaMask: boolean;
    coinbaseWallet: boolean;
    trustWallet: boolean;
    isHttps: boolean;
    isLocalhost: boolean;
  }>({
    ethereum: false,
    metaMask: false,
    coinbaseWallet: false,
    trustWallet: false,
    isHttps: false,
    isLocalhost: false,
  });

  useEffect(() => {
    // Check wallet availability
    const checkWallets = () => {
      const ethereum = (window as any).ethereum;
      setWalletStatus({
        ethereum: !!ethereum,
        metaMask: !!(ethereum?.isMetaMask),
        coinbaseWallet: !!(ethereum?.isCoinbaseWallet),
        trustWallet: !!(ethereum?.isTrust),
        isHttps: window.location.protocol === 'https:',
        isLocalhost: window.location.hostname === 'localhost',
      });
    };

    checkWallets();
    // Check again after a short delay (some wallets inject asynchronously)
    setTimeout(checkWallets, 1000);
  }, []);

  const testConnection = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const eth = (window as any).ethereum;
      if (!eth) {
        alert('No Ethereum provider found');
        return;
      }

      const accounts = await eth.request({ method: 'eth_requestAccounts' });
      alert(`Connected! Account: ${accounts[0]}`);
    } catch (error) {
      console.error('Connection test failed:', error);
      alert('Connection failed. Check console for details.');
    }
  };

  // Only show in development or if there are issues
  if (walletStatus.isLocalhost) return null;

  return (
    <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 2 }}>
      <Typography variant="h6" gutterBottom>🔧 Wallet Connection Debug</Typography>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
        <Chip
          label={`Ethereum: ${walletStatus.ethereum ? '✅' : '❌'}`}
          color={walletStatus.ethereum ? 'success' : 'error'}
          size="small"
        />
        <Chip
          label={`MetaMask: ${walletStatus.metaMask ? '✅' : '❌'}`}
          color={walletStatus.metaMask ? 'success' : 'error'}
          size="small"
        />
        <Chip
          label={`Coinbase: ${walletStatus.coinbaseWallet ? '✅' : '❌'}`}
          color={walletStatus.coinbaseWallet ? 'success' : 'error'}
          size="small"
        />
        <Chip
          label={`Trust: ${walletStatus.trustWallet ? '✅' : '❌'}`}
          color={walletStatus.trustWallet ? 'success' : 'error'}
          size="small"
        />
        <Chip
          label={`HTTPS: ${walletStatus.isHttps ? '✅' : '❌'}`}
          color={walletStatus.isHttps ? 'success' : 'error'}
          size="small"
        />
      </Box>

      {!walletStatus.isHttps && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          ⚠️ HTTPS is required for wallet connections in production environments.
        </Alert>
      )}

      {!walletStatus.ethereum && (
        <Alert severity="info" sx={{ mb: 2 }}>
          💡 Install MetaMask or another Web3 wallet to connect.
        </Alert>
      )}

      <Button
        variant="outlined"
        size="small"
        onClick={testConnection}
        disabled={!walletStatus.ethereum}
      >
        Test Connection
      </Button>
    </Box>
  );
}
