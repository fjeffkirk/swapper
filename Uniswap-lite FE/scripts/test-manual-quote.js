// Test manual quote calculation
import { parseEther, parseUnits, formatEther, formatUnits } from 'ethers';

// Test data from our pool check
const RESERVE_YTK = 1000n; // YTK reserve (token0)
const RESERVE_WTIA = 1n;   // WTIA reserve (token1)

// Manual Uniswap V2 calculation
function calculateOutput(inputAmount, inputReserve, outputReserve) {
  // Using 0.3% fee: outputAmount = (inputAmount * 997 * outputReserve) / (inputReserve * 1000 + inputAmount * 997)
  const numerator = inputAmount * 997n * outputReserve;
  const denominator = inputReserve * 1000n + inputAmount * 997n;
  return numerator / denominator;
}

// Test TIA -> YTK swap
const tiaAmount = parseEther('0.001'); // 0.001 TIA
const ytkOutput = calculateOutput(tiaAmount, RESERVE_WTIA, RESERVE_YTK);
console.log('TIA → YTK calculation:');
console.log('Input:', formatEther(tiaAmount), 'TIA');
console.log('Output:', formatEther(ytkOutput), 'YTK');
console.log('Exchange rate:', Number(formatEther(ytkOutput)) / Number(formatEther(tiaAmount)), 'YTK per TIA');

// Test YTK -> TIA swap
const ytkAmount = parseEther('1'); // 1 YTK
const tiaOutput = calculateOutput(ytkAmount, RESERVE_YTK, RESERVE_WTIA);
console.log('\nYTK → TIA calculation:');
console.log('Input:', formatEther(ytkAmount), 'YTK');
console.log('Output:', formatEther(tiaOutput), 'TIA');
console.log('Exchange rate:', Number(formatEther(tiaOutput)) / Number(formatEther(ytkAmount)), 'TIA per YTK');
