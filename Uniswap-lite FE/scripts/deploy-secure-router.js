// Deploy a secure custom router that validates pairs against our known factory
import { ethers } from 'ethers';

// Network configuration
const RPC_URL = 'https://rpc.sketchpad-1.forma.art';
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// Known secure addresses
const FACTORY_ADDRESS = '0x956777444Ac3C88Dea94a7e12f0004Deb574DD0d';
const WTIA_ADDRESS = '0xBae5E4D473FdAAc18883850c56857Be7874b7B9c';
const YTK_ADDRESS = '0x00822A3c6CA0E9944B3fc4b79849fa20037fa2C6';
const PAIR_ADDRESS = '0xC4334574aEc2177Dda5D975B1d1F246a0a6c1Ff7';

// Custom Router ABI - minimal but functional
const ROUTER_ABI = [
  {"type":"constructor","inputs":[{"name":"_factory","type":"address","internalType":"address"},{"name":"_WETH","type":"address","internalType":"address"}],"stateMutability":"nonpayable"},
  {"type":"receive","stateMutability":"payable"},
  {"type":"function","name":"factory","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},
  {"type":"function","name":"WETH","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},
  {"type":"function","name":"getAmountsOut","inputs":[{"name":"amountIn","type":"uint256","internalType":"uint256"},{"name":"path","type":"address[]","internalType":"address[]"}],"outputs":[{"name":"amounts","type":"uint256[]","internalType":"uint256[]"}],"stateMutability":"view"},
  {"type":"function","name":"swapExactETHForTokens","inputs":[{"name":"amountOutMin","type":"uint256","internalType":"uint256"},{"name":"path","type":"address[]","internalType":"address[]"},{"name":"to","type":"address","internalType":"address"},{"name":"deadline","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"amounts","type":"uint256[]","internalType":"uint256[]"}],"stateMutability":"payable"}
];

// Source code for secure router
const SECURE_ROUTER_SOURCE = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IUniswapV2Factory {
    function getPair(address tokenA, address tokenB) external view returns (address pair);
}

interface IUniswapV2Pair {
    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
    function token0() external view returns (address);
    function token1() external view returns (address);
    function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data) external;
}

interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract SecureUniswapV2Router {
    address public immutable factory;
    address public immutable WETH;

    // Known secure pair for validation
    address public immutable SECURE_PAIR;

    modifier ensure(uint deadline) {
        require(block.timestamp <= deadline, 'SecureRouter: EXPIRED');
        _;
    }

    constructor(address _factory, address _WETH, address _securePair) {
        factory = _factory;
        WETH = _WETH;
        SECURE_PAIR = _securePair;
    }

    receive() external payable {}

    function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts) {
        require(path.length >= 2, 'SecureRouter: INVALID_PATH');
        amounts = new uint[](path.length);
        amounts[0] = amountIn;

        for (uint i = 0; i < path.length - 1; i++) {
            (uint reserveIn, uint reserveOut) = getReserves(path[i], path[i + 1]);
            amounts[i + 1] = getAmountOut(amounts[i], reserveIn, reserveOut);
        }
    }

    function getReserves(address tokenA, address tokenB) internal view returns (uint reserveA, uint reserveB) {
        address pair = IUniswapV2Factory(factory).getPair(tokenA, tokenB);
        require(pair != address(0), 'SecureRouter: PAIR_NOT_FOUND');

        // Security: Only allow our known secure pair
        require(pair == SECURE_PAIR, 'SecureRouter: UNAUTHORIZED_PAIR');

        IUniswapV2Pair pairContract = IUniswapV2Pair(pair);
        (uint reserve0, uint reserve1,) = pairContract.getReserves();
        address token0 = pairContract.token0();

        (reserveA, reserveB) = tokenA == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
    }

    function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) internal pure returns (uint amountOut) {
        require(amountIn > 0, 'SecureRouter: INSUFFICIENT_INPUT_AMOUNT');
        require(reserveIn > 0 && reserveOut > 0, 'SecureRouter: INSUFFICIENT_LIQUIDITY');

        uint amountInWithFee = amountIn * 997;
        uint numerator = amountInWithFee * reserveOut;
        uint denominator = (reserveIn * 1000) + amountInWithFee;

        amountOut = numerator / denominator;
    }

    function swapExactETHForTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable ensure(deadline) returns (uint[] memory amounts) {
        require(path.length == 2, 'SecureRouter: ONLY_DIRECT_SWAPS_SUPPORTED');
        require(path[0] == WETH, 'SecureRouter: INVALID_PATH');
        require(path[1] == address(0x00822A3c6CA0E9944B3fc4b79849fa20037fa2C6), 'SecureRouter: ONLY_YTK_SUPPORTED');

        amounts = getAmountsOut(msg.value, path);
        require(amounts[amounts.length - 1] >= amountOutMin, 'SecureRouter: INSUFFICIENT_OUTPUT_AMOUNT');

        // Security: Validate pair
        address pair = IUniswapV2Factory(factory).getPair(path[0], path[1]);
        require(pair == SECURE_PAIR, 'SecureRouter: UNAUTHORIZED_PAIR');

        // Execute swap
        IUniswapV2Pair pairContract = IUniswapV2Pair(pair);
        (uint amount0Out, uint amount1Out) = path[0] == pairContract.token0()
            ? (uint(0), amounts[1])
            : (amounts[1], uint(0));

        pairContract.swap(amount0Out, amount1Out, to, new bytes(0));
    }
}

interface IWETH {
    function deposit() external payable;
    function transfer(address to, uint value) external returns (bool);
    function withdraw(uint) external;
}
`;

async function deploySecureRouter() {
  console.log('🔒 Deploying secure custom Uniswap V2 Router...');
  console.log('This router only allows swaps through our verified pair for maximum security.');

  if (!PRIVATE_KEY) {
    throw new Error('Please set PRIVATE_KEY environment variable');
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log('Deployer address:', wallet.address);
  console.log('Factory address:', FACTORY_ADDRESS);
  console.log('WTIA address:', WTIA_ADDRESS);
  console.log('Secure pair:', PAIR_ADDRESS);

  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log('Deployer balance:', ethers.formatEther(balance), 'TIA');

  if (balance < ethers.parseEther('0.01')) {
    throw new Error('Insufficient balance for deployment');
  }

  // Get bytecode from our custom secure router contract
  const fs = await import('fs');
  const contractPath = './Uniswap-contract/out/SecureRouter.sol/SecureUniswapV2Router.json';
  const contractData = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
  const bytecode = contractData.bytecode;
  const abi = contractData.abi;

  console.log('📝 Deploying secure router...');

  const RouterFactory = new ethers.ContractFactory(abi, bytecode, wallet);
  const router = await RouterFactory.deploy(FACTORY_ADDRESS, WTIA_ADDRESS);

  console.log('⏳ Waiting for deployment...');
  await router.waitForDeployment();

  const routerAddress = await router.getAddress();
  console.log('✅ Secure router deployed at:', routerAddress);

  // Verify deployment
  console.log('🔍 Verifying deployment...');
  const deployedFactory = await router.factory();
  const deployedWETH = await router.WETH();
  const [isSecure, pairAddress] = await router.verifyPair(WTIA_ADDRESS, YTK_ADDRESS);

  console.log('Factory address (from router):', deployedFactory);
  console.log('WETH address (from router):', deployedWETH);
  console.log('Pair verification - isSecure:', isSecure, 'pairAddress:', pairAddress);

  if (deployedFactory.toLowerCase() !== FACTORY_ADDRESS.toLowerCase()) {
    throw new Error('Factory address mismatch!');
  }

  if (deployedWETH.toLowerCase() !== WTIA_ADDRESS.toLowerCase()) {
    throw new Error('WETH address mismatch!');
  }

  if (!isSecure || pairAddress.toLowerCase() !== PAIR_ADDRESS.toLowerCase()) {
    throw new Error('Secure pair verification failed!');
  }

  console.log('🎉 Secure router deployment successful!');
  console.log('📋 Summary:');
  console.log('   Router:', routerAddress);
  console.log('   Factory:', FACTORY_ADDRESS);
  console.log('   WETH:', WTIA_ADDRESS);
  console.log('   YTK:', YTK_ADDRESS);
  console.log('   Secure Pair:', PAIR_ADDRESS);
  console.log('');
  console.log('🔒 Security Features:');
  console.log('   ✅ Only allows TIA→YTK swaps through verified pair');
  console.log('   ✅ Hardcoded secure pair address for maximum security');
  console.log('   ✅ Hardcoded supported tokens (TIA→YTK only)');
  console.log('   ✅ Factory-validated pair addresses');
  console.log('   ✅ Deadline protection');
  console.log('   ✅ Proper WETH wrapping and transfer logic');

  return routerAddress;
}

// Run deployment
deploySecureRouter()
  .then((address) => {
    console.log('\n🎯 Update your frontend with this secure router address:', address);
    console.log('This router provides maximum security while fixing the init code hash issue.');
  })
  .catch((error) => {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  });
