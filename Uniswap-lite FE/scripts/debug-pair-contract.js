// Debug the pair contract to see if it has the functions the router expects
import { ethers } from 'ethers';

// Network configuration
const RPC_URL = 'https://rpc.sketchpad-1.forma.art';
const PAIR_ADDRESS = '0xC4334574aEc2177Dda5D975B1d1F246a0a6c1Ff7';
const WTIA_ADDRESS = '0xBae5E4D473FdAAc18883850c56857Be7874b7B9c';
const YTK_ADDRESS = '0x00822A3c6CA0E9944B3fc4b79849fa20037fa2C6';

async function debugPair() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);

  console.log('🔍 Debugging pair contract...');

  // Check if pair contract exists
  const pairCode = await provider.getCode(PAIR_ADDRESS);
  console.log('Pair bytecode length:', pairCode.length);

  if (pairCode === '0x') {
    console.error('Pair contract not found!');
    return;
  }

  // Uniswap V2 Pair ABI
  const pairAbi = [
    'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
    'function token0() external view returns (address)',
    'function token1() external view returns (address)',
    'function factory() external view returns (address)',
    'function kLast() external view returns (uint)',
    'function price0CumulativeLast() external view returns (uint)',
    'function price1CumulativeLast() external view returns (uint)',
    'function mint(address to) external returns (uint liquidity)',
    'function burn(address to) external returns (uint amount0, uint amount1)',
    'function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data) external',
    'function skim(address to) external',
    'function sync() external'
  ];

  const pair = new ethers.Contract(PAIR_ADDRESS, pairAbi, provider);

  try {
    console.log('Checking token addresses...');
    const token0 = await pair.token0();
    const token1 = await pair.token1();
    console.log('Token0:', token0);
    console.log('Token1:', token1);
    console.log('Expected WTIA:', WTIA_ADDRESS);
    console.log('Expected YTK:', YTK_ADDRESS);

    console.log('Checking reserves...');
    const [reserve0, reserve1, timestamp] = await pair.getReserves();
    console.log('Reserve0:', reserve0.toString());
    console.log('Reserve1:', reserve1.toString());
    console.log('Timestamp:', timestamp);

    console.log('Checking factory...');
    const factory = await pair.factory();
    console.log('Factory:', factory);

    // Test if the pair can handle the Uniswap V2 Library calculations
    console.log('Testing pair compatibility...');

    // This is what the router library does - it needs to call getReserves
    // and then do calculations on the reserves
    console.log('✅ Pair contract exists and has reserves');

  } catch (error) {
    console.error('❌ Pair contract error:', error.message);
  }
}

debugPair().catch(console.error);
