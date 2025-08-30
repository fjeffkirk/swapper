// Fixed script to add liquidity with correct addresses
import { ethers } from 'ethers';

const RPC_URL = 'https://rpc.sketchpad-1.forma.art';
const PRIVATE_KEY = process.env.PRIVATE_KEY || process.argv[2] || '0xyour_private_key_here';

// Use the correct addresses discovered by check-pool.js
const ROUTER_ADDRESS = '0x52FfddaD55fa773b4f127159E02C4C9B0cF54717';
const WTIA_ADDRESS = '0xBae5E4D473FdAAc18883850c56857Be7874b7B9c';
const YTK_ADDRESS = '0x00822a3c6c0ae9944b3fc4b79849fa20037fa2c6';

const ROUTER_ABI = [
  'function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) payable returns (uint amountToken, uint amountETH, uint liquidity)',
  'function WETH() view returns(address)',
  'function factory() view returns(address)'
];

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function balanceOf(address) view returns (uint256)'
];

async function addLiquidity() {
  if (!PRIVATE_KEY || PRIVATE_KEY.includes('your_private_key')) {
    console.error('❌ Please provide your private key');
    console.log('Usage:');
    console.log('  export PRIVATE_KEY=0xyour_key_here && node add-liquidity-fixed.js');
    console.log('  or');
    console.log('  node add-liquidity-fixed.js 0xyour_key_here');
    return;
  }

  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    console.log('🔗 Connected to:', RPC_URL);
    console.log('👤 Using address:', wallet.address);

    // Check balances
    const tiaBalance = await provider.getBalance(wallet.address);
    console.log('💰 TIA balance:', ethers.formatEther(tiaBalance));

    const ytk = new ethers.Contract(YTK_ADDRESS, ERC20_ABI, wallet);
    const ytkBalance = await ytk.balanceOf(wallet.address);
    console.log('🪙 YTK balance:', ethers.formatEther(ytkBalance));

    // Setup contracts
    const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, wallet);

    // Approve YTK spending
    console.log('🔓 Approving YTK spending...');
    const approveTx = await ytk.approve(ROUTER_ADDRESS, ethers.MaxUint256);
    await approveTx.wait();
    console.log('✅ YTK approved');

    // Add liquidity
    console.log('🏊 Adding liquidity...');
    console.log('📥 Adding 1 TIA + 1000 YTK');

    const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour
    const tx = await router.addLiquidityETH(
      YTK_ADDRESS,           // token
      ethers.parseEther('1000'),  // amountTokenDesired (1000 YTK)
      0,                     // amountTokenMin
      0,                     // amountETHMin
      wallet.address,        // to
      deadline,              // deadline
      {
        value: ethers.parseEther('1'), // 1 TIA
        gasLimit: 500000
      }
    );

    console.log('⏳ Transaction submitted:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ Liquidity added successfully!');
    console.log('🔍 Transaction:', `https://explorer.sketchpad-1.forma.art/tx/${tx.hash}`);

  } catch (error) {
    console.error('❌ Error adding liquidity:', error.message);

    if (error.message.includes('insufficient funds')) {
      console.log('💰 Not enough TIA or YTK tokens');
    } else if (error.message.includes('execution reverted')) {
      console.log('🔄 Transaction reverted - check contract state');
    }
  }
}

addLiquidity();
