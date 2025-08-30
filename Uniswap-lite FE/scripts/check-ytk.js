// Check if YTK contract exists and works
import { ethers } from 'ethers';

const RPC_URL = 'https://rpc.sketchpad-1.forma.art';
const YTK_ADDRESS = '0x00822A3c6CA0E9944B3fc4b79849fa20037fa2C6';
const USER_ADDRESS = '0x9C8fE44D70A0f8e51C8A36a3DB0e4064F9dD146d';

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function totalSupply() view returns (uint256)'
];

async function checkYTK() {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const ytk = new ethers.Contract(YTK_ADDRESS, ERC20_ABI, provider);

    console.log('🔍 Checking YTK contract:', YTK_ADDRESS);

    // Check if contract exists
    const code = await provider.getCode(YTK_ADDRESS);
    if (code === '0x') {
      console.log('❌ YTK contract does not exist!');
      return;
    }

    console.log('✅ YTK contract exists');

    // Check basic info
    try {
      const name = await ytk.name();
      const symbol = await ytk.symbol();
      const decimals = await ytk.decimals();
      const totalSupply = await ytk.totalSupply();

      console.log('📋 Token Info:');
      console.log('   Name:', name);
      console.log('   Symbol:', symbol);
      console.log('   Decimals:', decimals);
      console.log('   Total Supply:', ethers.formatEther(totalSupply));
    } catch (error) {
      console.log('❌ Failed to get token info:', error.message);
    }

    // Check user balance
    try {
      const balance = await ytk.balanceOf(USER_ADDRESS);
      console.log('👤 Your YTK balance:', ethers.formatEther(balance));
    } catch (error) {
      console.log('❌ Failed to get balance:', error.message);
    }

  } catch (error) {
    console.error('❌ Error checking YTK contract:', error.message);
  }
}

checkYTK();
