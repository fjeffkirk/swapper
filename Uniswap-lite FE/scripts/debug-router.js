// Debug the router contract
import { ethers } from 'ethers';

const RPC_URL = 'https://rpc.sketchpad-1.forma.art';
const ROUTER_ADDRESS = '0x52FfddaD55fa773b4f127159E02C4C9B0cF54717';
const WTIA_ADDRESS = '0xBae5E4D473FdAAc18883850c56857Be7874b7B9c';
const YTK_ADDRESS = '0x00822A3c6CA0E9944B3fc4b79849fa20037fa2C6';
const USER_ADDRESS = '0x9C8fE44D70A0f8e51C8A36a3DB0e4064F9dD146d';

const ROUTER_ABI = [
  'function WETH() view returns(address)',
  'function factory() view returns(address)',
  'function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) payable returns (uint amountToken, uint amountETH, uint liquidity)',
  'function getAmountsOut(uint amountIn, address[] calldata path) view returns (uint[] memory amounts)'
];

const FACTORY_ABI = [
  'function getPair(address tokenA, address tokenB) view returns(address)',
  'function createPair(address tokenA, address tokenB) returns(address)'
];

async function debugRouter() {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);

    console.log('🔍 Debugging router contract...');

    // Check router contract
    const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, provider);

    // Get basic info
    const weth = await router.WETH();
    const factory = await router.factory();

    console.log('📋 Router Info:');
    console.log('   WETH:', weth);
    console.log('   Factory:', factory);
    console.log('   Our WTIA:', WTIA_ADDRESS);
    console.log('   Match?', weth.toLowerCase() === WTIA_ADDRESS.toLowerCase());

    // Check if pair exists
    const factoryContract = new ethers.Contract(factory, FACTORY_ABI, provider);
    const pairAddress = await factoryContract.getPair(WTIA_ADDRESS, YTK_ADDRESS);

    console.log('🏭 Pair Info:');
    console.log('   Pair address:', pairAddress);

    if (pairAddress === ethers.ZeroAddress) {
      console.log('❌ No pair exists - need to create pair first');
      return;
    }

    console.log('✅ Pair exists');

    // Try to estimate gas for addLiquidityETH
    console.log('⛽ Estimating gas for addLiquidityETH...');

    const deadline = Math.floor(Date.now() / 1000) + 3600;
    const wallet = new ethers.Wallet('0x' + '0'.repeat(64), provider); // dummy wallet for estimation
    const routerWithWallet = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, wallet);

    try {
      const gasEstimate = await routerWithWallet.estimateGas.addLiquidityETH(
        YTK_ADDRESS,
        ethers.parseEther('100'),
        0,
        0,
        USER_ADDRESS,
        deadline,
        { value: ethers.parseEther('0.1') }
      );
      console.log('✅ Gas estimation successful:', gasEstimate.toString());
    } catch (error) {
      console.log('❌ Gas estimation failed:', error.message);
    }

  } catch (error) {
    console.error('❌ Error debugging router:', error.message);
  }
}

debugRouter();
