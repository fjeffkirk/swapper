// Deploy new Uniswap V2 Router
import { ethers } from 'ethers';

// Network configuration
const RPC_URL = 'https://rpc.sketchpad-1.forma.art';
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// Contract addresses
const FACTORY_ADDRESS = '0x956777444Ac3C88Dea94a7e12f0004Deb574DD0d'; // From our test
const WTIA_ADDRESS = '0xBae5E4D473FdAAc18883850c56857Be7874b7B9c'; // Router's WETH address

// Router ABI (full ABI from compiled contract)
const ROUTER_ABI = [
  {"type":"constructor","inputs":[{"name":"_factory","type":"address","internalType":"address"},{"name":"_WETH","type":"address","internalType":"address"}],"stateMutability":"nonpayable"},
  {"type":"receive","stateMutability":"payable"},
  {"type":"function","name":"WETH","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},
  {"type":"function","name":"factory","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"}
];

async function deployRouter() {
  console.log('🚀 Deploying new Uniswap V2 Router...');

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

  // Deploy router
  console.log('📝 Deploying router contract...');

  // Get bytecode from compiled contract
  const fs = await import('fs');
  const contractPath = './Uniswap-contract/out/UniswapV2Router02.sol/UniswapV2Router02.json';
  const contractData = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
  const bytecode = contractData.bytecode;

  const RouterFactory = new ethers.ContractFactory(ROUTER_ABI, bytecode, wallet);
  const router = await RouterFactory.deploy(FACTORY_ADDRESS, WTIA_ADDRESS);

  console.log('⏳ Waiting for deployment...');
  await router.waitForDeployment();

  const routerAddress = await router.getAddress();
  console.log('✅ Router deployed at:', routerAddress);

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

  console.log('🎉 Router deployment successful!');
  console.log('📋 Summary:');
  console.log('   Router:', routerAddress);
  console.log('   Factory:', FACTORY_ADDRESS);
  console.log('   WETH:', WTIA_ADDRESS);

  return routerAddress;
}

// Run deployment
deployRouter()
  .then((address) => {
    console.log('\n🎯 Update your frontend with this router address:', address);
  })
  .catch((error) => {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  });
