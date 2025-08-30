// Extract router bytecode and ABI from compiled contract
import { readFileSync } from 'fs';
import { ethers } from 'ethers';

const contractPath = './Uniswap-contract/out/UniswapV2Router02.sol/UniswapV2Router02.json';

try {
  const contractData = JSON.parse(readFileSync(contractPath, 'utf8'));

  console.log('✅ Contract data loaded');
  console.log('Bytecode length:', contractData.bytecode?.length || 0);
  console.log('ABI length:', contractData.abi?.length || 0);

  // Export for deployment script
  console.log('\n// Copy this ABI to your deployment script:');
  console.log('const ROUTER_ABI =', JSON.stringify(contractData.abi, null, 2));

  console.log('\n// Copy this bytecode to your deployment script:');
  console.log('const ROUTER_BYTECODE =', JSON.stringify(contractData.bytecode));

} catch (error) {
  console.error('❌ Failed to extract contract data:', error.message);
}
