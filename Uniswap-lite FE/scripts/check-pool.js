// Quick script to check pool state
import { ethers } from 'ethers';

const RPC_URL = 'https://rpc.sketchpad-1.forma.art';
const ROUTER_ADDRESS = '0x52FfddaD55fa773b4f127159E02C4C9B0cF54717';
const WTIA_ADDRESS = '0xBae5E4D473FdAAc18883850c56857Be7874b7B9c'; // Router's WETH address
const YTK_ADDRESS = '0x00822A3c6CA0E9944B3fc4b79849fa20037fa2C6';
const EXISTING_PAIR_ADDRESS = '0xC4334574aEc2177Dda5D975B1d1F246a0a6c1Ff7'; // From debug-router.js

const ROUTER_ABI = [
  'function WETH() view returns(address)',
  'function factory() view returns(address)',
  'function getAmountsOut(uint amountIn, address[] calldata path) view returns (uint[] memory amounts)'
];

const FACTORY_ABI = [
  'function getPair(address tokenA, address tokenB) view returns(address)'
];

const PAIR_ABI = [
  'function getReserves() view returns(uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() view returns(address)',
  'function token1() view returns(address)'
];

async function checkPool() {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);

    // Check router
    const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, provider);
    const routerWeth = await router.WETH();
    console.log('Router WETH address:', routerWeth);
    console.log('Our WTIA address:', WTIA_ADDRESS);
    console.log('Do they match?', routerWeth.toLowerCase() === WTIA_ADDRESS.toLowerCase());

    // Get factory
    const factoryAddress = await router.factory();
    console.log('Factory address:', factoryAddress);

    // Check the existing pair that the user mentioned
    const pairAddress = EXISTING_PAIR_ADDRESS;
    console.log('🎯 Using existing pair address:', pairAddress);

    // Verify this pair exists
    const code = await provider.getCode(pairAddress);
    if (code === '0x') {
      console.log('❌ Pair contract does not exist at this address!');
      return;
    }

    // Check pair reserves
    const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);
    const [reserve0, reserve1] = await pair.getReserves();
    const token0 = await pair.token0();
    const token1 = await pair.token1();

    console.log('✅ Pair exists!');
    console.log('Token0:', token0, 'Reserve0:', ethers.formatEther(reserve0));
    console.log('Token1:', token1, 'Reserve1:', ethers.formatEther(reserve1));

    // Test getAmountsOut
    try {
      const path = [WTIA_ADDRESS, YTK_ADDRESS];
      const amountIn = ethers.parseEther('0.1'); // 0.1 TIA
      const amounts = await router.getAmountsOut(amountIn, path);
      console.log('✅ getAmountsOut works!');
      console.log('Input: 0.1 WTIA');
      console.log('Output:', ethers.formatEther(amounts[1]), 'YTK');
    } catch (error) {
      console.log('❌ getAmountsOut failed:', error.message);
    }

  } catch (error) {
    console.error('Error checking pool:', error);
  }
}

checkPool();
