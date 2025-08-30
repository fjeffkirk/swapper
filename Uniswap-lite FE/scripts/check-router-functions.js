// Check if the new router has the right functions
import { ethers } from 'ethers';

// Network configuration
const RPC_URL = 'https://rpc.sketchpad-1.forma.art';
const ROUTER_ADDRESS = '0xe5785237B71C824a701e88120980CC777e953b5B';
const WTIA_ADDRESS = '0xBae5E4D473FdAAc18883850c56857Be7874b7B9c';
const YTK_ADDRESS = '0x00822A3c6CA0E9944B3fc4b79849fa20037fa2C6';

async function checkRouter() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);

  console.log('🔍 Checking router functions...');

  // Check if router contract exists
  const routerCode = await provider.getCode(ROUTER_ADDRESS);
  console.log('Router bytecode length:', routerCode.length);

  if (routerCode === '0x') {
    console.error('Router contract not found!');
    return;
  }

  // Basic ABI for checking
  const routerAbi = [
    'function factory() external pure returns (address)',
    'function WETH() external pure returns (address)',
    'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)'
  ];

  const router = new ethers.Contract(ROUTER_ADDRESS, routerAbi, provider);

  try {
    console.log('Checking factory()...');
    const factory = await router.factory();
    console.log('✅ Factory:', factory);

    console.log('Checking WETH()...');
    const weth = await router.WETH();
    console.log('✅ WETH:', weth);

    console.log('Testing getAmountsOut...');
    const path = [WTIA_ADDRESS, YTK_ADDRESS];
    const amountIn = ethers.parseEther('0.001');

    console.log('Path:', path);
    console.log('Amount in:', amountIn.toString());

    const amounts = await router.getAmountsOut(amountIn, path);
    console.log('✅ getAmountsOut result:', amounts.map(a => a.toString()));

  } catch (error) {
    console.error('❌ Error:', error.message);

    // Try to get more details about the error
    if (error.code === 'CALL_EXCEPTION') {
      console.log('This is a CALL_EXCEPTION - the contract reverted');
      console.log('Reason:', error.reason || 'Unknown');
      console.log('Data:', error.data || 'No data');
    }
  }
}

checkRouter().catch(console.error);
