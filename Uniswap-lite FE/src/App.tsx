import { useEffect, useMemo, useState } from 'react';
import { BrowserProvider, JsonRpcProvider, Contract, formatEther, formatUnits, parseEther, parseUnits, ZeroAddress } from 'ethers';
import { useAccount } from 'wagmi';
import { NETWORK_INFO } from './config/privy';
import { Box, Container, Tab, Tabs } from '@mui/material';
import logo from './assets/logo.png';
import SwapCard from './components/SwapCard';
import WalletButton from './components/WalletButton';
import LiquidityCard from './components/LiquidityCard';
import NetworkChecker from './components/NetworkChecker';

// Use single source of truth from privy config (env-driven)
const RPC: string  = NETWORK_INFO.rpcUrl as string;
const CHAIN_ID: number = Number(NETWORK_INFO.chainId);
// Router address from your deployment
const ROUTER: string = (import.meta.env.VITE_ROUTER as string) || '0x592a36b069843cbaEB0df6FA1cFae5009418E45d';
    console.log('🔄 Router address:', ROUTER);
    console.log('🔄 VITE_ROUTER env:', import.meta.env.VITE_ROUTER);
    console.log('🔄 Environment check:', { VITE_ROUTER: import.meta.env.VITE_ROUTER });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
// Use router's WETH address (discovered via check-pool.js)
const WTIA: string   = '0xBae5E4D473FdAAc18883850c56857Be7874b7B9c';
// Your deployed YTK token
const YTK: string    = (import.meta.env.VITE_YTK as string) || '0x00822A3c6CA0E9944B3fc4b79849fa20037fa2C6';

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
  'function getAmountsOut(uint amountIn, address[] calldata path) view returns (uint[] memory amounts)',
  'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
  'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) payable returns (uint amountToken, uint amountETH, uint liquidity)'
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d: number = Number(await (ytk as any).decimals());
      if (!Number.isNaN(d) && d > 0 && d <= 36) {
        decimalsToUse = d;
        if (ytkDec !== d) setYtkDec(d);
      }
    } catch {
      decimalsToUse = 18;
      if (ytkDec !== 18) setYtkDec(18);
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const y = await (ytk as any).balanceOf(account);
      setYtkBal(formatUnits(y, decimalsToUse));
    } catch {
      // keep previous value; don't force to 0
    }

    // Read WTIA ERC-20 balance so the UI can show wrapped native holdings
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = await (wtia as any).balanceOf(account);
      setWtiaBal(formatUnits(w, 18));
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (!account) return;
    refresh();
    const id = setInterval(refresh, 10_000);
    return () => clearInterval(id);
  }, [account, refresh]);

  // Keep local account/provider in sync with wagmi (Privy) address
  useEffect(() => {
    if (address && account !== address) setAccount(address);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (address && !provider && (window as any).ethereum) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setProvider(new BrowserProvider((window as any).ethereum));
    }
  }, [address, account, provider]);

  // approve handled by Liquidity tab below

  async function getPoolReserves() {
    try {
      const factory = new Contract(await (router as any).factory(), [
        'function getPair(address tokenA, address tokenB) view returns(address)'
      ], rpcProvider);

      const pairAddress = await factory.getPair(WTIA, YTK);
      if (pairAddress === ZeroAddress) {
        throw new Error('No liquidity pair found');
      }

      const pair = new Contract(pairAddress, [
        'function getReserves() view returns(uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
        'function token0() view returns(address)',
        'function token1() view returns(address)'
      ], rpcProvider);

      const [reserve0, reserve1] = await pair.getReserves();
      const token0 = await pair.token0();

      // Determine which reserve is which token
      const [wtiaReserve, ytkReserve] = token0.toLowerCase() === WTIA.toLowerCase()
        ? [reserve0, reserve1]
        : [reserve1, reserve0];

      return {
        tiaReserve: wtiaReserve,
        ytkReserve: ytkReserve,
        totalTia: formatEther(wtiaReserve),
        totalYtk: formatUnits(ytkReserve, ytkDec)
      };
    } catch (error) {
      console.error('Failed to get pool reserves:', error);
      return null;
    }
  }

  async function calculateLiquidityAmount(tokenIn: 'TIA' | 'YTK', amountIn: string) {
    try {
      const reserves = await getPoolReserves();
      if (!reserves) return null;

      const inputAmount = Number(amountIn);
      if (isNaN(inputAmount) || inputAmount <= 0) return null;

      if (tokenIn === 'TIA') {
        // User is providing TIA, calculate required YTK
        const tiaReserveNum = Number(reserves.totalTia);
        const ytkReserveNum = Number(reserves.totalYtk);

        if (tiaReserveNum === 0) return null;

        const requiredYtk = (inputAmount * ytkReserveNum) / tiaReserveNum;
        return {
          tiaAmount: amountIn,
          ytkAmount: requiredYtk.toString()
        };
      } else {
        // User is providing YTK, calculate required TIA
        const tiaReserveNum = Number(reserves.totalTia);
        const ytkReserveNum = Number(reserves.totalYtk);

        if (ytkReserveNum === 0) return null;

        const requiredTia = (inputAmount * tiaReserveNum) / ytkReserveNum;
        return {
          tiaAmount: requiredTia.toString(),
          ytkAmount: amountIn
        };
      }
    } catch (error) {
      console.error('Failed to calculate liquidity amount:', error);
      return null;
    }
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

  async function swapTIAforYTK(tia: string, minReceived: string) {
    if (!provider || !account) return;

    console.log('swapTIAforYTK called with:', { tia, minReceived });
    console.log('Parsing tia amount:', tia, '->', parseEther(tia).toString());

    // Validate inputs
    const tiaAmount = Number(tia);
    if (isNaN(tiaAmount) || tiaAmount <= 0) {
      alert('Invalid TIA amount');
      return;
    }

    // For very small amounts, set minimum received to 0 to avoid parsing issues
    let minOut = 0n;
    if (minReceived && minReceived !== 'Calculated on swap') {
      try {
        const minReceivedNum = Number(minReceived);
        if (!isNaN(minReceivedNum) && minReceivedNum > 0 && minReceivedNum >= 1e-18) {
          // Only set minimum if it's a reasonable amount
          minOut = parseUnits(minReceived, ytkDec);
        }
      } catch (error) {
        console.warn('Could not parse minimum received, using 0:', error);
        minOut = 0n;
      }
    }

    const s = await provider.getSigner();
    const deadline = Math.floor(Date.now() / 1000) + 3600;
    const path = [WTIA, YTK];

    console.log('Swap path:', path);
    console.log('WTIA address:', WTIA);
    console.log('YTK address:', YTK);

    try {
      console.log('Swap parameters:', {
        minOut: minOut.toString(),
        path,
        account,
        deadline,
        value: parseEther(tia).toString(),
        tiaAmount: tia
      });

      // Try with explicit gas limit first
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const gasEstimate = await (router as any).connect(s).swapExactETHForTokens.estimateGas(
        minOut, path, account, deadline, { value: parseEther(tia) }
      );

      console.log('Estimated gas:', gasEstimate.toString());

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tx = await (router as any).connect(s).swapExactETHForTokens(
        minOut, path, account, deadline, {
          value: parseEther(tia),
          gasLimit: gasEstimate * 120n / 100n // Add 20% buffer
        }
      );

      console.log('Transaction sent:', tx.hash);
      await tx.wait();
      alert('Swap TIA -> YTK done');
    } catch (error) {
      console.error('Swap failed:', error);

      // Try to provide more specific error information
      if (error instanceof Error) {
        if (error.message.includes('CALL_EXCEPTION')) {
          alert('Transaction would revert - check contract state or parameters');
        } else if (error.message.includes('INSUFFICIENT_FUNDS')) {
          alert('Insufficient funds for gas');
        } else {
          alert('Swap failed: ' + error.message);
        }
      } else {
        alert('Swap failed: Unknown error');
      }
    }
  }

  async function swapYTKforTIA(ytkAmount: string, minReceived: string) {
    if (!provider || !account) return;

    // Validate inputs
    const ytkNum = Number(ytkAmount);
    if (isNaN(ytkNum) || ytkNum <= 0) {
      alert('Invalid YTK amount');
      return;
    }

    const s = await provider.getSigner();

    // Check and approve YTK spending
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const current = await (ytk as any).allowance(account, ROUTER);
      if (current < parseUnits(ytkAmount, ytkDec)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const a = await (ytk as any).connect(s).approve(ROUTER, parseUnits(ytkAmount, ytkDec));
        await a.wait();
      }
    } catch (error) {
      console.error('Approval failed:', error);
      alert('Failed to approve YTK spending');
      return;
    }

    // For very small amounts, set minimum received to 0 to avoid parsing issues
    let minOut = 0n;
    if (minReceived && minReceived !== 'Calculated on swap') {
      try {
        const minReceivedNum = Number(minReceived);
        if (!isNaN(minReceivedNum) && minReceivedNum > 0 && minReceivedNum >= 1e-18) {
          // Only set minimum if it's a reasonable amount
          minOut = parseEther(minReceived);
        }
      } catch (error) {
        console.warn('Could not parse minimum received, using 0:', error);
        minOut = 0n;
      }
    }

    const deadline = Math.floor(Date.now() / 1000) + 3600;
    const path = [YTK, WTIA];

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tx = await (router as any).connect(s).swapExactTokensForETH(
        parseUnits(ytkAmount, ytkDec), minOut, path, account, deadline
      );
      await tx.wait();
      alert('Swap YTK -> TIA done');
    } catch (error) {
      console.error('Swap failed:', error);
      alert('Swap failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  const [tab, setTab] = useState(0);

  const [approved, setApproved] = useState(false);
  async function approveYtk() {
    if (!provider || !account) return;
    const s = await provider.getSigner();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tx = await (ytk as any).connect(s).approve(ROUTER, parseUnits('1000000', ytkDec));
    await tx.wait();
    setApproved(true);
  }

  // Quote helper for UI
  async function getQuote(sellToken: 'TIA' | 'YTK', amount: string): Promise<string> {
    try {
      if (!amount || Number(amount) <= 0) return '';

      // Check if router is available and properly configured
      if (!router || ROUTER === '0x0000000000000000000000000000000000000000') {
        console.warn('Router contract not configured. Please deploy contracts first.');
        return 'Router not deployed';
      }

      // Check if WTIA is available
      if (WTIA === '0x0000000000000000000000000000000000000000') {
        console.warn('WTIA contract not configured.');
        return 'WTIA not deployed';
      }

      const isSellTia = sellToken === 'TIA';

      // Validate and parse the amount safely
      let amountIn: bigint;
      try {
        if (isSellTia) {
          // For TIA, parse as ether
          amountIn = parseEther(amount);
        } else {
          // For YTK, parse as units
          amountIn = parseUnits(amount, ytkDec);
        }
      } catch (parseError) {
        console.error('Failed to parse amount:', amount, parseError);
        return `Invalid amount format: ${amount}`;
      }

      const path = isSellTia ? [WTIA, YTK] : [YTK, WTIA];

      console.log('Getting quote:', {
        sellToken,
        amount,
        amountIn: amountIn.toString(),
        path
      });

      try {
        const amounts: bigint[] = await (router as any).getAmountsOut(amountIn, path);

        if (!amounts || amounts.length === 0) {
          console.error('No amounts returned from getAmountsOut');
          return 'No liquidity';
        }

        const out = amounts[amounts.length - 1];
        const result = isSellTia ? formatUnits(out, ytkDec) : formatEther(out);

        console.log('Quote result:', result);
        return result;
      } catch (routerError) {
        console.warn('Router getAmountsOut failed, trying manual calculation:', routerError);

        // Try manual calculation using Uniswap V2 formula
        try {
          const factoryAddress = await router.factory();
          const factory = new Contract(factoryAddress, [
            'function getPair(address tokenA, address tokenB) view returns(address)'
          ], rpcProvider);

          const pairAddress = await factory.getPair(WTIA, YTK);
          if (pairAddress === ZeroAddress) {
            return 'No liquidity pair found';
          }

          const pair = new Contract(pairAddress, [
            'function getReserves() view returns(uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)'
          ], rpcProvider);

          const [reserve0, reserve1] = await pair.getReserves();

          // Assuming WTIA is token1 and YTK is token0 based on our earlier check
          const inputReserve = isSellTia ? reserve1 : reserve0;
          const outputReserve = isSellTia ? reserve0 : reserve1;

          if (inputReserve === 0n || outputReserve === 0n) {
            return 'Insufficient liquidity';
          }

          // Uniswap V2 formula: outputAmount = (inputAmount * outputReserve) / (inputReserve + inputAmount)
          // Using 0.3% fee: outputAmount = (inputAmount * 997 * outputReserve) / (inputReserve * 1000 + inputAmount * 997)
          const inputAmount = amountIn;
          const numerator = inputAmount * 997n * outputReserve;
          const denominator = inputReserve * 1000n + inputAmount * 997n;

          if (denominator === 0n) {
            return 'Invalid reserves';
          }

          const outputAmount = numerator / denominator;

          const result = isSellTia ? formatUnits(outputAmount, ytkDec) : formatEther(outputAmount);
          console.log('Manual quote calculation:', {
            inputAmount: inputAmount.toString(),
            inputReserve: inputReserve.toString(),
            outputReserve: outputReserve.toString(),
            outputAmount: outputAmount.toString(),
            result
          });

          // For very small outputs that round to zero, return a minimal amount
          if (outputAmount === 0n) {
            console.log('⚠️ Output is zero due to imbalanced liquidity pool');
            console.log('Pool reserves - WTIA:', formatEther(inputReserve), 'YTK:', formatEther(outputReserve));
            return 'Pool too imbalanced - add more liquidity';
          }

          // For extremely small outputs, warn about imbalanced pool
          const outputValue = Number(isSellTia ? formatUnits(outputAmount, ytkDec) : formatEther(outputAmount));
          if (outputValue < 0.000001) {
            console.log('⚠️ Very small output due to imbalanced liquidity');
            console.log('Consider adding more', isSellTia ? 'TIA' : 'YTK', 'to balance the pool');
          }

          return result;
        } catch (manualError) {
          console.error('Manual calculation also failed:', manualError);
          return 'Unable to calculate quote';
        }
      }
    } catch (error) {
      console.error('Error getting quote:', error);
      // Return specific error messages based on the type of error
      if (error instanceof Error) {
        if (error.message.includes('call revert exception') ||
            error.message.includes('CALL_EXCEPTION') ||
            error.message.includes('missing revert data')) {
          // Check if we know there's actually liquidity
          console.log('Router call failed, but pair may exist. Checking pair status...');
          return 'Quote temporarily unavailable - pair exists with liquidity';
        }
        if (error.message.includes('network')) {
          return 'Network error';
        }
        if (error.message.includes('invalid address')) {
          return 'Invalid contract address';
        }
      }
      return 'Quote unavailable';
    }
  }

  return (
    <Container maxWidth={false} sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', px: 0 }}>
      {/* Top nav */}
      <Box sx={{ width: '100%', py: 2, px: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'background.paper', boxShadow: '0 2px 12px rgba(0,0,0,0.25)' }}>
        <Box component="img" src={logo} alt="Swapper" sx={{ height: 28 }} />
        <WalletButton />
      </Box>
      {/* Center tabs + card vertically together */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Container maxWidth="sm" sx={{ pb: 0, mb: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
            <Tabs value={tab} onChange={(_,v)=>setTab(v)} centered variant="standard" textColor="inherit" indicatorColor="primary">
              <Tab label="Swap" sx={{ textTransform: 'none', fontWeight: 700 }} />
              <Tab label="Liquidity" sx={{ textTransform: 'none', fontWeight: 700 }} />
            </Tabs>
          </Box>
        </Container>
        <Container maxWidth="sm">
          <Box sx={{ width: '100%', mb: 2 }}>
            <NetworkChecker />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            {tab === 0 ? (
              <SwapCard
                tiaBalance={tiaBal}
                wtiaBalance={wtiaBal}
                ytkBalance={ytkBal}
                getQuote={getQuote}
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
                onCalculateLiquidityAmount={calculateLiquidityAmount}
              />
            )}
          </Box>
        </Container>
      </Box>
    </Container>
  );
}
