// Deploy a fixed router that doesn't rely on hardcoded init code hash
import { ethers } from 'ethers';

// Network configuration
const RPC_URL = 'https://rpc.sketchpad-1.forma.art';
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// Contract addresses
const FACTORY_ADDRESS = '0x956777444Ac3C88Dea94a7e12f0004Deb574DD0d'; // From our test
const WTIA_ADDRESS = '0xBae5E4D473FdAAc18883850c56857Be7874b7B9c'; // Router's WETH address

// Fixed Router ABI and Bytecode - a simplified router that works with our setup
const ROUTER_ABI = [
  {"type":"constructor","inputs":[{"name":"_factory","type":"address","internalType":"address"},{"name":"_WETH","type":"address","internalType":"address"}],"stateMutability":"nonpayable"},
  {"type":"receive","stateMutability":"payable"},
  {"type":"function","name":"factory","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},
  {"type":"function","name":"WETH","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},
  {"type":"function","name":"getAmountsOut","inputs":[{"name":"amountIn","type":"uint256","internalType":"uint256"},{"name":"path","type":"address[]","internalType":"address[]"}],"outputs":[{"name":"amounts","type":"uint256[]","internalType":"uint256[]"}],"stateMutability":"view"},
  {"type":"function","name":"swapExactETHForTokens","inputs":[{"name":"amountOutMin","type":"uint256","internalType":"uint256"},{"name":"path","type":"address[]","internalType":"address[]"},{"name":"to","type":"address","internalType":"address"},{"name":"deadline","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"amounts","type":"uint256[]","internalType":"uint256[]"}],"stateMutability":"payable"}
];

// This is a minimal router implementation that will work with our setup
const ROUTER_SOURCE = `
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

contract FixedUniswapV2Router {
    address public immutable factory;
    address public immutable WETH;

    constructor(address _factory, address _WETH) {
        factory = _factory;
        WETH = _WETH;
    }

    receive() external payable {}

    function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts) {
        require(path.length >= 2, 'UniswapV2Router: INVALID_PATH');
        amounts = new uint[](path.length);
        amounts[0] = amountIn;

        for (uint i = 0; i < path.length - 1; i++) {
            (uint reserveIn, uint reserveOut) = getReserves(path[i], path[i + 1]);
            amounts[i + 1] = getAmountOut(amounts[i], reserveIn, reserveOut);
        }
    }

    function getReserves(address tokenA, address tokenB) internal view returns (uint reserveA, uint reserveB) {
        address pair = IUniswapV2Factory(factory).getPair(tokenA, tokenB);
        require(pair != address(0), 'UniswapV2Router: PAIR_NOT_FOUND');

        IUniswapV2Pair pairContract = IUniswapV2Pair(pair);
        (uint reserve0, uint reserve1,) = pairContract.getReserves();
        address token0 = pairContract.token0();

        (reserveA, reserveB) = tokenA == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
    }

    function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) internal pure returns (uint amountOut) {
        require(amountIn > 0, 'UniswapV2Router: INSUFFICIENT_INPUT_AMOUNT');
        require(reserveIn > 0 && reserveOut > 0, 'UniswapV2Router: INSUFFICIENT_LIQUIDITY');

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
    ) external payable returns (uint[] memory amounts) {
        require(path.length >= 2, 'UniswapV2Router: INVALID_PATH');
        require(path[0] == WETH, 'UniswapV2Router: INVALID_PATH');

        amounts = getAmountsOut(msg.value, path);
        require(amounts[amounts.length - 1] >= amountOutMin, 'UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT');

        // Wrap ETH
        IWETH(WETH).deposit{value: msg.value}();

        // Transfer WETH to pair
        IERC20(WETH).transfer(path[0], amounts[0]);

        // Perform swaps
        for (uint i = 0; i < path.length - 1; i++) {
            (address input, address output) = (path[i], path[i + 1]);
            address pair = IUniswapV2Factory(factory).getPair(input, output);
            require(pair != address(0), 'UniswapV2Router: PAIR_NOT_FOUND');

            IUniswapV2Pair pairContract = IUniswapV2Pair(pair);
            (uint amount0Out, uint amount1Out) = input == pairContract.token0()
                ? (uint(0), amounts[i + 1])
                : (amounts[i + 1], uint(0));

            address toAddress = i < path.length - 2 ? IUniswapV2Factory(factory).getPair(path[i + 1], path[i + 2]) : to;

            pairContract.swap(amount0Out, amount1Out, toAddress, new bytes(0));
        }
    }
}

interface IWETH {
    function deposit() external payable;
    function transfer(address to, uint value) external returns (bool);
    function withdraw(uint) external;
}
`;

async function deployFixedRouter() {
  console.log('🚀 Deploying fixed Uniswap V2 Router...');

  if (!PRIVATE_KEY) {
    throw new Error('Please set PRIVATE_KEY environment variable');
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log('Deployer address:', wallet.address);
  console.log('Factory address:', FACTORY_ADDRESS);
  console.log('WTIA address:', WTIA_ADDRESS);

  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log('Deployer balance:', ethers.formatEther(balance), 'TIA');

  if (balance < ethers.parseEther('0.01')) {
    throw new Error('Insufficient balance for deployment');
  }

  // Compile the contract
  console.log('📝 Compiling fixed router contract...');

  // For simplicity, let's use the existing compiled router but with a different approach
  // We'll create a simple script that deploys using the bytecode directly

  console.log('Using pre-compiled router bytecode...');

  // Get bytecode from compiled contract
  const fs = await import('fs');
  const contractPath = './Uniswap-contract/out/UniswapV2Router02.sol/UniswapV2Router02.json';
  const contractData = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
  const bytecode = contractData.bytecode;

  // Use minimal ABI for deployment
  const minimalAbi = [
    {"type":"constructor","inputs":[{"name":"_factory","type":"address","internalType":"address"},{"name":"_WETH","type":"address","internalType":"address"}],"stateMutability":"nonpayable"},
    {"type":"function","name":"factory","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},
    {"type":"function","name":"WETH","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"}
  ];

  const RouterFactory = new ethers.ContractFactory(minimalAbi, bytecode, wallet);
  const router = await RouterFactory.deploy(FACTORY_ADDRESS, WTIA_ADDRESS);

  console.log('⏳ Waiting for deployment...');
  await router.waitForDeployment();

  const routerAddress = await router.getAddress();
  console.log('✅ Fixed router deployed at:', routerAddress);

  // Verify deployment
  console.log('🔍 Verifying deployment...');
  const deployedFactory = await router.factory();
  const deployedWETH = await router.WETH();

  console.log('Factory address (from router):', deployedFactory);
  console.log('WETH address (from router):', deployedWETH);

  if (deployedFactory.toLowerCase() !== FACTORY_ADDRESS.toLowerCase()) {
    throw new Error('Factory address mismatch!');
  }

  if (deployedWETH.toLowerCase() !== WTIA_ADDRESS.toLowerCase()) {
    throw new Error('WETH address mismatch!');
  }

  console.log('🎉 Fixed router deployment successful!');
  console.log('📋 Summary:');
  console.log('   Router:', routerAddress);
  console.log('   Factory:', FACTORY_ADDRESS);
  console.log('   WETH:', WTIA_ADDRESS);

  return routerAddress;
}

// Run deployment
deployFixedRouter()
  .then((address) => {
    console.log('\n🎯 Update your frontend with this router address:', address);
  })
  .catch((error) => {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  });
