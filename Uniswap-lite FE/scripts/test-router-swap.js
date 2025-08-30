// Test router swap function directly
import { ethers } from 'ethers';

// Network configuration
const RPC_URL = 'https://rpc.sketchpad-1.forma.art';
const ROUTER_ADDRESS = '0x1687ecad448aB465ED427490167BC18D83D294aE';
const WTIA_ADDRESS = '0xBae5E4D473FdAAc18883850c56857Be7874b7B9c';
const YTK_ADDRESS = '0x00822A3c6CA0E9944B3fc4b79849fa20037fa2C6';

async function testRouter() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);

  // Check if router contract exists
  const routerCode = await provider.getCode(ROUTER_ADDRESS);
  console.log('Router contract code length:', routerCode.length);

  if (routerCode === '0x') {
    console.error('Router contract not found at address:', ROUTER_ADDRESS);
    return;
  }

  // Create router contract instance
  const routerAbi = [
    'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)',
    'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
    'function WETH() external pure returns (address)',
    'function factory() external pure returns (address)'
  ];

  const router = new ethers.Contract(ROUTER_ADDRESS, routerAbi, provider);

  try {
    // Check WETH address
    const wethAddress = await router.WETH();
    console.log('Router WETH address:', wethAddress);
    console.log('Expected WTIA address:', WTIA_ADDRESS);
    console.log('Do they match?', wethAddress.toLowerCase() === WTIA_ADDRESS.toLowerCase());

    // First check if the pair exists
    const factoryAbi = [
      'function getPair(address tokenA, address tokenB) external view returns (address pair)'
    ];

    console.log('Checking factory...');

    const factoryAddr = await router.factory();
    console.log('Factory address:', factoryAddr);

    const factory = new ethers.Contract(factoryAddr, factoryAbi, provider);
    const pairAddress = await factory.getPair(WTIA_ADDRESS, YTK_ADDRESS);
    console.log('Pair address:', pairAddress);

    if (pairAddress === ethers.ZeroAddress) {
      console.error('Pair does not exist!');
      return;
    }

    // Check pair reserves
    const pairAbi = [
      'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
      'function token0() external view returns (address)',
      'function token1() external view returns (address)'
    ];

    const pair = new ethers.Contract(pairAddress, pairAbi, provider);
    const [reserve0, reserve1] = await pair.getReserves();
    const token0 = await pair.token0();
    const token1 = await pair.token1();

    console.log('Pair reserves:');
    console.log('Token0:', token0, 'Reserve0:', reserve0.toString());
    console.log('Token1:', token1, 'Reserve1:', reserve1.toString());

    if (reserve0 === 0n || reserve1 === 0n) {
      console.error('Pair has no liquidity!');
      return;
    }

    // Test both path directions
    console.log('\n=== Testing Path Directions ===');

    // Test WTIA -> YTK path
    const path1 = [WTIA_ADDRESS, YTK_ADDRESS];
    const amountIn1 = ethers.parseEther('0.001'); // Small test amount

    console.log('Testing WTIA -> YTK path:', path1);
    console.log('Amount in:', ethers.formatEther(amountIn1), 'WTIA');

    try {
      const amounts1 = await router.getAmountsOut(amountIn1, path1);
      console.log('✅ WTIA -> YTK result:', amounts1.map(a => ethers.formatEther(a)));
    } catch (error) {
      console.log('❌ WTIA -> YTK failed:', error.message);
    }

    // Test YTK -> WTIA path
    const path2 = [YTK_ADDRESS, WTIA_ADDRESS];
    const amountIn2 = ethers.parseEther('1'); // 1 YTK

    console.log('\nTesting YTK -> WTIA path:', path2);
    console.log('Amount in:', ethers.formatEther(amountIn2), 'YTK');

    try {
      const amounts2 = await router.getAmountsOut(amountIn2, path2);
      console.log('✅ YTK -> WTIA result:', amounts2.map(a => ethers.formatEther(a)));
    } catch (error) {
      console.log('❌ YTK -> WTIA failed:', error.message);
    }

    // Test manual calculation
    console.log('\n=== Manual Calculation Test ===');
    console.log('Pool: 1000 YTK + 1 WTIA');

    // Manual Uniswap V2 calculation for WTIA -> YTK
    const fee = 997n; // 0.3% fee
    const inputAmount = ethers.parseEther('0.001'); // 0.001 WTIA
    const inputReserve = ethers.parseEther('1'); // 1 WTIA
    const outputReserve = ethers.parseEther('1000'); // 1000 YTK

    const numerator = inputAmount * fee * outputReserve;
    const denominator = inputReserve * 1000n + inputAmount * fee;
    const outputAmount = numerator / denominator;

    console.log('Manual WTIA -> YTK:');
    console.log('Input:', ethers.formatEther(inputAmount), 'WTIA');
    console.log('Expected output:', ethers.formatEther(outputAmount), 'YTK');
    console.log('Exchange rate:', Number(ethers.formatEther(outputAmount)) / Number(ethers.formatEther(inputAmount)), 'YTK per WTIA');

  } catch (error) {
    console.error('Router test failed:', error.message);
    console.error('Error details:', error);
  }
}

testRouter().catch(console.error);
