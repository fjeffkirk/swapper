export const NETWORK_INFO = {
  network: import.meta.env.VITE_NETWORK,
  chainId: Number(import.meta.env.VITE_CHAIN_ID),
  chainName: import.meta.env.VITE_CHAIN_NAME as string,
  rpcUrl: import.meta.env.VITE_CHAIN_RPC as string,
  explorerName: import.meta.env.VITE_CHAIN_EXPLORER_NAME as string,
  explorerUrl: import.meta.env.VITE_CHAIN_EXPLORER_URL as string,
  isMainnet: (import.meta.env.VITE_NETWORK === 'mainnet'),
  isTestnet: (import.meta.env.VITE_NETWORK !== 'mainnet'),
};

export const PRIVY_APP_ID = (import.meta.env.DEV ? import.meta.env.VITE_PRIVY_APP_ID_DEV : import.meta.env.VITE_PRIVY_APP_ID_PROD) as string;

export const PRIVY_CONFIG = {
  appearance: { theme: 'dark', accentColor: '#1DA1F2' },
  loginMethods: ['email', 'google', 'twitter', 'wallet'],
  embeddedWallets: { createOnLogin: 'users-without-wallets' },
  session: { maxAge: 60 * 60 * 24 * 7 },
  storage: { createIfNotFound: true },
  supportedChains: [
    {
      id: NETWORK_INFO.chainId,
      name: NETWORK_INFO.chainName,
      network: NETWORK_INFO.network,
      nativeCurrency: { name: 'TIA', symbol: 'TIA', decimals: 18 },
      rpcUrls: { default: { http: [NETWORK_INFO.rpcUrl] } },
      blockExplorers: NETWORK_INFO.explorerUrl ? { default: { name: NETWORK_INFO.explorerName, url: NETWORK_INFO.explorerUrl } } : undefined,
    }
  ],
} as const;
