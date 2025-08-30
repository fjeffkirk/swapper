// Find the actual YTK token contract
import { ethers } from 'ethers';

const RPC_URL = 'https://rpc.sketchpad-1.forma.art';
const USER_ADDRESS = '0x9C8fE44D70A0f8e51C8A36a3DB0e4064F9dD146d';

// Common ERC20 function signatures to identify YTK
const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)'
];

// Check some potential addresses
const POTENTIAL_ADDRESSES = [
  '0x00822A3c6CA0E9944B3fc4b79849fa20037fa2C6', // Current YTK address
  '0x52FfddaD55fa773b4f127159E02C4C9B0cF54717', // Router address
  '0xBae5E4D473FdAAc18883850c56857Be7874b7B9c', // WTIA address
];

async function checkAddress(provider, address, name) {
  try {
    console.log(`\n🔍 Checking ${name}: ${address}`);

    // Check if contract exists
    const code = await provider.getCode(address);
    if (code === '0x') {
      console.log('❌ No contract at this address');
      return null;
    }

    console.log('✅ Contract exists at this address');

    // Try to call ERC20 functions
    const contract = new ethers.Contract(address, ERC20_ABI, provider);

    try {
      const symbol = await contract.symbol();
      const name = await contract.name();
      const decimals = await contract.decimals();
      const totalSupply = await contract.totalSupply();

      console.log('📋 Token Details:');
      console.log('   Name:', name);
      console.log('   Symbol:', symbol);
      console.log('   Decimals:', decimals);
      console.log('   Total Supply:', ethers.formatEther(totalSupply));

      if (symbol === 'YTK' || name.includes('YourToken')) {
        console.log('🎯 FOUND YTK TOKEN!');
        return { address, symbol, name, decimals, totalSupply };
      }

    } catch (error) {
      console.log('❌ Not an ERC20 token or call failed');
    }

  } catch (error) {
    console.log('❌ Error checking address:', error.message);
  }

  return null;
}

async function findYTK() {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);

    console.log('🔍 Searching for YTK token...');
    console.log('👤 User address:', USER_ADDRESS);

    // Check known addresses
    for (const addr of POTENTIAL_ADDRESSES) {
      const result = await checkAddress(provider, addr, 'Potential Address');
      if (result) {
        console.log('\n🎉 SUCCESS! Found YTK token at:', result.address);
        return result;
      }
    }

    // Check recent transactions from user to find deployments
    console.log('\n📊 Checking recent transactions to find token deployments...');

    const blockNumber = await provider.getBlockNumber();
    console.log('Current block:', blockNumber);

    // Get recent blocks and check for contract deployments
    for (let i = 0; i < 10; i++) {
      try {
        const block = await provider.getBlock(blockNumber - i, true);
        console.log(`\nBlock ${block.number}:`);

        for (const tx of block.transactions) {
          if (tx.to === null && tx.from === USER_ADDRESS) {
            // Contract deployment
            const receipt = await provider.getTransactionReceipt(tx.hash);
            if (receipt && receipt.contractAddress) {
              console.log('📝 Contract deployment found:', receipt.contractAddress);
              const result = await checkAddress(provider, receipt.contractAddress, 'Deployed Contract');
              if (result) {
                return result;
              }
            }
          }
        }
      } catch (error) {
        console.log('Error checking block:', error.message);
      }
    }

    console.log('\n❌ Could not find YTK token. You may need to deploy it.');

  } catch (error) {
    console.error('❌ Error finding YTK:', error.message);
  }
}

findYTK();
