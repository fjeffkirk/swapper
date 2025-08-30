// Compile and deploy the secure router using solc
import { ethers } from 'ethers';
import solc from 'solc';

// Network configuration
const RPC_URL = 'https://rpc.sketchpad-1.forma.art';
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// Contract addresses
const FACTORY_ADDRESS = '0x956777444Ac3C88Dea94a7e12f0004Deb574DD0d';
const WTIA_ADDRESS = '0xBae5E4D473FdAAc18883850c56857Be7874b7B9c';
const YTK_ADDRESS = '0x00822A3c6CA0E9944B3fc4b79849fa20037fa2C6';
const PAIR_ADDRESS = '0xC4334574aEc2177Dda5D975B1d1F246a0a6c1Ff7';

// Secure Router Source Code
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

interface IWETH {
    function deposit() external payable;
    function transfer(address to, uint value) external returns (bool);
    function withdraw(uint) external;
}

contract SecureUniswapV2Router {
    address public immutable factory;
    address public immutable WETH;

    // Known secure pair for validation - hardcoded for security
    address public immutable SECURE_PAIR = 0xC4334574aEc2177Dda5D975B1d1F246a0a6c1Ff7;

    // Supported tokens - hardcoded for security
    address public immutable YTK = 0x00822A3c6CA0E9944B3fc4b79849fa20037fa2C6;

    modifier ensure(uint deadline) {
        require(block.timestamp <= deadline, 'SecureRouter: EXPIRED');
        _;
    }

    constructor(address _factory, address _WETH) {
        factory = _factory;
        WETH = _WETH;
    }

    receive() external payable {}

    function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts) {
        require(path.length == 2, 'SecureRouter: ONLY_DIRECT_SWAPS_SUPPORTED');
        require(path[0] == WETH, 'SecureRouter: INVALID_PATH');
        require(path[1] == YTK, 'SecureRouter: ONLY_YTK_SUPPORTED');

        amounts = new uint[](2);
        amounts[0] = amountIn;

        (uint reserveIn, uint reserveOut) = getReserves(path[0], path[1]);
        amounts[1] = getAmountOut(amounts[0], reserveIn, reserveOut);
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
        require(path[1] == YTK, 'SecureRouter: ONLY_YTK_SUPPORTED');

        // Calculate amounts manually to avoid recursion
        amounts = new uint[](2);
        amounts[0] = msg.value;

        (uint reserveIn, uint reserveOut) = getReserves(path[0], path[1]);
        amounts[1] = getAmountOut(amounts[0], reserveIn, reserveOut);
        require(amounts[1] >= amountOutMin, 'SecureRouter: INSUFFICIENT_OUTPUT_AMOUNT');

        // Security: Validate pair
        address pair = IUniswapV2Factory(factory).getPair(path[0], path[1]);
        require(pair == SECURE_PAIR, 'SecureRouter: UNAUTHORIZED_PAIR');

        // Wrap ETH to WETH
        IWETH(WETH).deposit{value: msg.value}();

        // Transfer WETH to pair
        IERC20(WETH).transfer(pair, amounts[0]);

        // Execute swap
        IUniswapV2Pair pairContract = IUniswapV2Pair(pair);
        (uint amount0Out, uint amount1Out) = path[0] == pairContract.token0()
            ? (uint(0), amounts[1])
            : (amounts[1], uint(0));

        pairContract.swap(amount0Out, amount1Out, to, new bytes(0));
    }

    // Security function to verify pair authenticity
    function verifyPair(address tokenA, address tokenB) external view returns (bool isSecure, address pairAddress) {
        pairAddress = IUniswapV2Factory(factory).getPair(tokenA, tokenB);
        isSecure = (pairAddress == SECURE_PAIR);
    }
}
`;

async function compileAndDeploy() {
  console.log('🔨 Compiling and deploying secure router...');

  if (!PRIVATE_KEY) {
    throw new Error('Please set PRIVATE_KEY environment variable');
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log('Deployer address:', wallet.address);

  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log('Deployer balance:', ethers.formatEther(balance), 'TIA');

  if (balance < ethers.parseEther('0.01')) {
    throw new Error('Insufficient balance for deployment');
  }

  try {
    // Compile the contract using solc
    console.log('📝 Compiling contract...');

    const input = {
      language: 'Solidity',
      sources: {
        'SecureRouter.sol': {
          content: SECURE_ROUTER_SOURCE
        }
      },
      settings: {
        outputSelection: {
          '*': {
            '*': ['*']
          }
        },
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    };

    const output = JSON.parse(solc.compile(JSON.stringify(input)));

    if (output.errors) {
      console.error('❌ Compilation errors:', output.errors);
      return;
    }

    const contractName = 'SecureUniswapV2Router';
    const bytecode = output.contracts['SecureRouter.sol'][contractName].evm.bytecode.object;
    const abi = output.contracts['SecureRouter.sol'][contractName].abi;

    console.log('✅ Contract compiled successfully');

    // Deploy the contract
    console.log('🚀 Deploying contract...');

    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    const contract = await factory.deploy(FACTORY_ADDRESS, WTIA_ADDRESS);

    console.log('⏳ Waiting for deployment...');
    await contract.waitForDeployment();

    const contractAddress = await contract.getAddress();
    console.log('✅ Secure router deployed at:', contractAddress);

    // Verify deployment
    console.log('🔍 Verifying deployment...');

    const [isSecure, pairAddress] = await contract.verifyPair(WTIA_ADDRESS, YTK_ADDRESS);
    console.log('Pair verification - isSecure:', isSecure, 'pairAddress:', pairAddress);

    if (!isSecure || pairAddress.toLowerCase() !== PAIR_ADDRESS.toLowerCase()) {
      throw new Error('Secure pair verification failed!');
    }

    console.log('🎉 Secure router deployment successful!');
    console.log('📋 Summary:');
    console.log('   Router:', contractAddress);
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

    return contractAddress;

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    if (error.errors) {
      console.error('Compilation errors:', error.errors);
    }
    throw error;
  }
}

// Run compilation and deployment
compileAndDeploy()
  .then((address) => {
    console.log('\n🎯 Update your frontend with this secure router address:', address);
    console.log('This router provides maximum security while fixing the init code hash issue.');
  })
  .catch((error) => {
    console.error('❌ Process failed:', error.message);
    process.exit(1);
  });
