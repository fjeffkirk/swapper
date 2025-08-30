// Test getAmountsOut with different paths
import { ethers } from 'ethers';

const RPC_URL = 'https://rpc.sketchpad-1.forma.art';
const ROUTER_ADDRESS = '0x52FfddaD55fa773b4f127159E02C4C9B0cF54717';
const WTIA_ADDRESS = '0xBae5E4D473FdAAc18883850c56857Be7874b7B9c';
const YTK_ADDRESS = '0x00822A3c6CA0E9944B3fc4b79849fa20037fa2C6';

const ROUTER_ABI = [
  'function getAmountsOut(uint amountIn, address[] calldata path) view returns (uint[] memory amounts)'
];

async function testQuote() {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, provider);

    const amountIn = ethers.parseEther('0.1'); // 0.1 TIA

    console.log('🧪 Testing getAmountsOut...');
    console.log('Amount in:', ethers.formatEther(amountIn), 'TIA');

    // Test different paths
    const paths = [
      [WTIA_ADDRESS, YTK_ADDRESS], // WTIA -> YTK (normal swap)
      [YTK_ADDRESS, WTIA_ADDRESS], // YTK -> WTIA (reverse)
    ];

    for (let i = 0; i < paths.length; i++) {
      const path = paths[i];
      const direction = i === 0 ? 'TIA → YTK' : 'YTK → TIA';

      console.log(`\n🔄 Testing path ${i + 1}: ${direction}`);
      console.log('Path:', path);

      try {
        const amounts = await router.getAmountsOut(amountIn, path);
        console.log('✅ Success!');
        console.log('Input amount:', ethers.formatEther(amounts[0]));
        console.log('Output amount:', ethers.formatEther(amounts[1]));
      } catch (error) {
        console.log('❌ Failed:', error.message);

        // Try with smaller amount
        console.log('🔄 Trying with smaller amount...');
        try {
          const smallAmount = ethers.parseEther('0.01'); // 0.01 TIA
          const amounts = await router.getAmountsOut(smallAmount, path);
          console.log('✅ Small amount works!');
          console.log('Input:', ethers.formatEther(amounts[0]));
          console.log('Output:', ethers.formatEther(amounts[1]));
        } catch (error2) {
          console.log('❌ Even small amount failed:', error2.message);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error testing quote:', error.message);
  }
}

testQuote();
