import { useEffect, useMemo, useState } from 'react';
import { BrowserProvider, JsonRpcProvider, Contract, formatEther, formatUnits, parseEther, parseUnits } from 'ethers';
import { useAccount } from 'wagmi';
import { NETWORK_INFO } from './config/privy';
import { Box, Container, Tab, Tabs } from '@mui/material';
import SwapCard from './components/SwapCard';
import WalletButton from './components/WalletButton';
import LiquidityCard from './components/LiquidityCard';
import NetworkChecker from './components/NetworkChecker';

// Use single source of truth from privy config (env-driven)
const RPC: string  = NETWORK_INFO.rpcUrl as string;
const CHAIN_ID: number = Number(NETWORK_INFO.chainId);
const ROUTER: string = (import.meta.env.VITE_ROUTER as string);
const WTIA: string   = (import.meta.env.VITE_WTIA   as string);
// If env is missing/misread, fall back to the known YTK address provided
const YTK: string    = (import.meta.env.VITE_YTK as string) || '0x00822A3c6C0AE9944B3Fc4b79849fa20037fa2C6';

const erc20Abi = [
  'function decimals() view returns(uint8)',
  'function balanceOf(address) view returns(uint256)',
  'function allowance(address owner, address spender) view returns(uint256)',
  'function approve(address spender, uint256 value) returns (bool)'
];

const weth9Abi = [
  ...erc20Abi,
  'function deposit() payable',
  'function withdraw(uint256)'
];

const routerAbi = [
  'function WETH() view returns(address)',
  'function factory() view returns(address)',
  'function addLiquidityETH(address token,uint amountTokenDesired,uint amountTokenMin,uint amountETHMin,address to,uint deadline) payable returns (uint amountToken,uint amountETH,uint liquidity)',
  'function swapExactETHForTokens(uint amountOutMin,address[] calldata path,address to,uint deadline) payable returns (uint[] memory amounts)',
  'function swapExactTokensForETH(uint amountIn,uint amountOutMin,address[] calldata path,address to,uint deadline) returns (uint[] memory amounts)'
];

export default function App() {
  const [account, setAccount] = useState<string>('');
  const [ytkDec, setYtkDec] = useState<number>(18);
  const [ytkBal, setYtkBal] = useState<string>('0');
  const [tiaBal, setTiaBal] = useState<string>('0');
  const [wtiaBal, setWtiaBal] = useState<string>('0');
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const { address } = useAccount();

  const rpcProvider = useMemo(() => new JsonRpcProvider(RPC, CHAIN_ID), []);
  // Always use rpcProvider for read calls to avoid wallet network/provider quirks
  const router = useMemo(() => new Contract(ROUTER, routerAbi, rpcProvider), [rpcProvider]);
  const ytk    = useMemo(() => new Contract(YTK,    erc20Abi,  rpcProvider), [rpcProvider]);
  const wtia   = useMemo(() => new Contract(WTIA,   weth9Abi,  rpcProvider), [rpcProvider]);

  async function connect() {
    const eth = (window as any).ethereum;
    if (!eth) { alert('Install MetaMask'); return; }
    const p = new BrowserProvider(eth);
    const network = await p.getNetwork();
    if (Number(network.chainId) !== CHAIN_ID) {
      await eth.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x' + CHAIN_ID.toString(16),
          chainName: 'Forma Sketchpad',
          nativeCurrency: { name: 'TIA', symbol: 'TIA', decimals: 18 },
          rpcUrls: [RPC],
          blockExplorerUrls: []
        }]
      });
    }
    const [addr] = await eth.request({ method: 'eth_requestAccounts' });
    setProvider(p);
    setAccount(addr);
  }

  async function refresh() {
    if (!account) return;
    const bal = await rpcProvider.getBalance(account);
    setTiaBal(formatEther(bal));

    // Try decimals; if it fails, assume 18 so balance can still display
    let decimalsToUse = ytkDec;
    try {
      const d: number = Number(await (ytk as any).decimals());
      if (!Number.isNaN(d) && d > 0 && d <= 36) {
        decimalsToUse = d;
        if (ytkDec !== d) setYtkDec(d);
      }
    } catch (_) {
      decimalsToUse = 18;
      if (ytkDec !== 18) setYtkDec(18);
    }

    try {
      const y = await (ytk as any).balanceOf(account);
      setYtkBal(formatUnits(y, decimalsToUse));
    } catch (_) {
      // keep previous value; don't force to 0
    }

    // Read WTIA ERC-20 balance so the UI can show wrapped native holdings
    try {
      const w = await (wtia as any).balanceOf(account);
      setWtiaBal(formatUnits(w, 18));
    } catch (_) {
      // ignore
    }
  }

  useEffect(() => {
    if (!account) return;
    refresh();
    const id = setInterval(refresh, 10_000);
    return () => clearInterval(id);
  }, [account]);

  // Keep local account/provider in sync with wagmi (Privy) address
  useEffect(() => {
    if (address && account !== address) setAccount(address);
    if (address && !provider && (window as any).ethereum) {
      setProvider(new BrowserProvider((window as any).ethereum));
    }
  }, [address]);

  // approve handled by Liquidity tab below

  async function wrapTIA(amount: string) {
    if (!provider) return;
    const s = await provider.getSigner();
    const tx = await (wtia as any).connect(s).deposit({ value: parseEther(amount) });
    await tx.wait();
    alert(`Wrapped ${amount} TIA -> WTIA`);
  }

  async function addLiquidityEth(ytkAmount: string, tiaAmount: string) {
    if (!provider || !account) return;
    const s = await provider.getSigner();
    const deadline = Math.floor(Date.now() / 1000) + 3600;
    const tx = await (router as any).connect(s).addLiquidityETH(
      YTK,
      parseUnits(ytkAmount, ytkDec),
      0, 0,
      account,
      deadline,
      { value: parseEther(tiaAmount) }
    );
    await tx.wait();
    alert('Liquidity added');
  }

  async function swapTIAforYTK(tia: string) {
    if (!provider || !account) return;
    const s = await provider.getSigner();
    const deadline = Math.floor(Date.now() / 1000) + 3600;
    const path = [WTIA, YTK];
    const tx = await (router as any).connect(s).swapExactETHForTokens(
      0, path, account, deadline, { value: parseEther(tia) }
    );
    await tx.wait();
    alert('Swap TIA -> YTK done');
  }

  async function swapYTKforTIA(ytkAmount: string) {
    if (!provider || !account) return;
    const s = await provider.getSigner();
    const current = await (ytk as any).allowance(account, ROUTER);
    if (current < parseUnits(ytkAmount, ytkDec)) {
      const a = await (ytk as any).connect(s).approve(ROUTER, parseUnits(ytkAmount, ytkDec));
      await a.wait();
    }
    const deadline = Math.floor(Date.now() / 1000) + 3600;
    const path = [YTK, WTIA];
    const tx = await (router as any).connect(s).swapExactTokensForETH(
      parseUnits(ytkAmount, ytkDec), 0, path, account, deadline
    );
    await tx.wait();
    alert('Swap YTK -> TIA done');
  }

  const [tab, setTab] = useState(0);

  const [approved, setApproved] = useState(false);
  async function approveYtk() {
    if (!provider || !account) return;
    const s = await provider.getSigner();
    const tx = await (ytk as any).connect(s).approve(ROUTER, parseUnits('1000000', ytkDec));
    await tx.wait();
    setApproved(true);
  }

  return (
    <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', py: 4 }}>
      <Box sx={{ width: '100%', mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div />
        <Tabs value={tab} onChange={(_,v)=>setTab(v)} variant="standard" textColor="inherit" indicatorColor="primary">
          <Tab label="Swap" sx={{ textTransform: 'none', fontWeight: 700 }} />
          <Tab label="Liquidity" sx={{ textTransform: 'none', fontWeight: 700 }} />
        </Tabs>
        {/* top right wallet button */}
        <WalletButton />
      </Box>
      <Box sx={{ width: '100%', mb: 2 }}>
        <NetworkChecker />
      </Box>
      <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {tab === 0 ? (
          <SwapCard
            account={account || null}
            tiaBalance={tiaBal}
            wtiaBalance={wtiaBal}
            ytkBalance={ytkBal}
            onConnect={connect}
            onSwapEthToYtk={swapTIAforYTK}
            onSwapYtkToEth={swapYTKforTIA}
          />
        ) : (
          <LiquidityCard
            account={account || null}
            tiaBalance={tiaBal}
            ytkBalance={ytkBal}
            isApproved={approved}
            onConnect={connect}
            onApproveYtk={approveYtk}
            onAddLiquidityEth={addLiquidityEth}
          />
        )}
      </Box>
    </Container>
  );
}
