// Check the actual init code hash for the pair contract
import { ethers } from 'ethers';

// Network configuration
const RPC_URL = 'https://rpc.sketchpad-1.forma.art';
const FACTORY_ADDRESS = '0x956777444Ac3C88Dea94a7e12f0004Deb574DD0d';
const WTIA_ADDRESS = '0xBae5E4D473FdAAc18883850c56857Be7874b7B9c';
const YTK_ADDRESS = '0x00822A3c6CA0E9944B3fc4b79849fa20037fa2C6';
const PAIR_ADDRESS = '0xC4334574aEc2177Dda5D975B1d1F246a0a6c1Ff7';

async function checkInitCodeHash() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);

  console.log('🔍 Checking init code hash...');

  // Get the factory contract
  const factoryAbi = [
    'function INIT_CODE_PAIR_HASH() external pure returns (bytes32)',
    'function getPair(address tokenA, address tokenB) external view returns (address pair)'
  ];

  const factory = new ethers.Contract(FACTORY_ADDRESS, factoryAbi, provider);

  try {
    // Check if the factory has an INIT_CODE_PAIR_HASH function
    console.log('Checking INIT_CODE_PAIR_HASH...');
    const initCodeHash = await factory.INIT_CODE_PAIR_HASH();
    console.log('✅ Init code hash from factory:', initCodeHash);

    // Calculate what the pair address should be using this hash
    const [token0, token1] = WTIA_ADDRESS < YTK_ADDRESS ? [WTIA_ADDRESS, YTK_ADDRESS] : [YTK_ADDRESS, WTIA_ADDRESS];

    const salt = ethers.keccak256(ethers.solidityPacked(['address', 'address'], [token0, token1]));

    const calculatedAddress = ethers.getCreate2Address(
      FACTORY_ADDRESS,
      salt,
      initCodeHash
    );

    console.log('Calculated pair address:', calculatedAddress);
    console.log('Actual pair address:', PAIR_ADDRESS);
    console.log('Addresses match:', calculatedAddress.toLowerCase() === PAIR_ADDRESS.toLowerCase());

    if (calculatedAddress.toLowerCase() !== PAIR_ADDRESS.toLowerCase()) {
      console.log('❌ Init code hash mismatch!');
      console.log('Expected hash for calculation:', initCodeHash);
    }

  } catch (error) {
    console.error('❌ Error checking init code hash:', error.message);

    // Try the alternative method - get the pair directly
    try {
      console.log('Trying to get pair directly...');
      const pair = await factory.getPair(WTIA_ADDRESS, YTK_ADDRESS);
      console.log('✅ Pair from factory:', pair);
    } catch (innerError) {
      console.error('❌ Could not get pair:', innerError.message);
    }
  }
}

checkInitCodeHash().catch(console.error);
