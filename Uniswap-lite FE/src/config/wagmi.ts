import { createConfig } from '@privy-io/wagmi';
import { http, type Chain } from 'viem';
import { NETWORK_INFO } from './privy';

export const customChain: Chain = {
  id: NETWORK_INFO.chainId,
  name: NETWORK_INFO.chainName,
  nativeCurrency: { name: 'TIA', symbol: 'TIA', decimals: 18 },
  rpcUrls: { default: { http: [NETWORK_INFO.rpcUrl] } },
};

export const wagmiConfig = createConfig({
  chains: [customChain],
  transports: { [customChain.id]: http(NETWORK_INFO.rpcUrl) },
  autoConnect: true,
  multiInjectedProviderDiscovery: true,
  ssr: false,
  storage: localStorage,
});
