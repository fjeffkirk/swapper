// Add liquidity with smaller amounts and better error checking
import { ethers } from 'ethers';

const RPC_URL = 'https://rpc.sketchpad-1.forma.art';
const PRIVATE_KEY = process.argv[2] || '0xyour_private_key_here';

// Correct addresses with proper checksum
const ROUTER_ADDRESS = '0x52FfddaD55fa773b4f127159E02C4C9B0cF54717';
const WTIA_ADDRESS = '0xBae5E4D473FdAAc18883850c56857Be7874b7B9c';
const YTK_ADDRESS = '0x00822A3c6CA0E9944B3fc4b79849fa20037fa2C6';

const ROUTER_ABI = [
  'function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) payable returns (uint amountToken, uint amountETH, uint liquidity)'
];

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)'
];

async function addLiquidity() {
  if (!PRIVATE_KEY || PRIVATE_KEY.includes('your_private_key')) {
    console.error('❌ Please provide your private key as an argument');
    console.log('Usage: node add-liquidity-small.js 0xyour_private_key');
    return;
  }

  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    console.log('🔗 Connected to Forma');
    console.log('👤 Using address:', wallet.address);

    // Check balances
    const tiaBalance = await provider.getBalance(wallet.address);
    console.log('💰 TIA balance:', ethers.formatEther(tiaBalance));

    const ytk = new ethers.Contract(YTK_ADDRESS, ERC20_ABI, wallet);
    const ytkBalance = await ytk.balanceOf(wallet.address);
    console.log('🪙 YTK balance:', ethers.formatEther(ytkBalance));

    // Use smaller amounts
    const tiaAmount = ethers.parseEther('0.1'); // 0.1 TIA
    const ytkAmount = ethers.parseEther('100'); // 100 YTK

    console.log('📊 Adding liquidity:');
    console.log('   TIA:', ethers.formatEther(tiaAmount));
    console.log('   YTK:', ethers.formatEther(ytkAmount));

    // Check if we have enough balance
    if (tiaBalance < tiaAmount) {
      console.log('❌ Not enough TIA balance');
      return;
    }
    if (ytkBalance < ytkAmount) {
      console.log('❌ Not enough YTK balance');
      return;
    }

    // Check current allowance
    const currentAllowance = await ytk.allowance(wallet.address, ROUTER_ADDRESS);
    console.log('🔍 Current YTK allowance:', ethers.formatEther(currentAllowance));

    // Approve if needed
    if (currentAllowance < ytkAmount) {
      console.log('🔓 Approving YTK spending...');
      const approveTx = await ytk.approve(ROUTER_ADDRESS, ethers.MaxUint256);
      console.log('⏳ Approval transaction submitted:', approveTx.hash);
      await approveTx.wait();
      console.log('✅ YTK approved');
    } else {
      console.log('✅ YTK already approved');
    }

    // Add liquidity
    const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, wallet);
    const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour

    console.log('🏊 Adding liquidity...');
    const tx = await router.addLiquidityETH(
      YTK_ADDRESS,
      ytkAmount,     // amountTokenDesired
      0,             // amountTokenMin
      0,             // amountETHMin
      wallet.address,// to
      deadline,      // deadline
      {
        value: tiaAmount, // TIA amount
        gasLimit: 500000
      }
    );

    console.log('⏳ Liquidity transaction submitted:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ Liquidity added successfully!');
    console.log('🔍 Transaction:', `https://explorer.sketchpad-1.forma.art/tx/${tx.hash}`);

  } catch (error) {
    console.error('❌ Error adding liquidity:', error.message);

    if (error.message.includes('insufficient funds')) {
      console.log('💰 Not enough TIA in wallet');
    } else if (error.message.includes('execution reverted')) {
      console.log('🔄 Transaction reverted - check contract addresses');
    } else if (error.message.includes('gas')) {
      console.log('⛽ Gas estimation failed');
    }
  }
}

addLiquidity();
