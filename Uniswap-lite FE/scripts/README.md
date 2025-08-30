# Uniswap Lite Scripts

This folder contains utility scripts for interacting with the Uniswap V2 contracts on Forma testnet.

## Scripts Overview

### Contract Deployment & Setup
- **`compile-and-deploy.js`** - Compiles and deploys the custom SecureRouter contract
- **`deploy-secure-router.js`** - Deploys the secure router with proper security checks
- **`deploy-router.js`** - Deploys standard Uniswap V2 router
- **`deploy-fixed-router.js`** - Deploys router with fixed INIT_CODE_PAIR_HASH
- **`extract-router-bytecode.js`** - Extracts bytecode from compiled contracts

### Liquidity Management
- **`add-liquidity-fixed.js`** - Adds fixed amount of liquidity to TIA/YTK pool
- **`add-liquidity-simple.js`** - Simple liquidity addition script
- **`add-liquidity-small.js`** - Adds small amount of liquidity for testing
- **`add-liquidity-guide.md`** - Documentation for adding liquidity

### Testing & Debugging
- **`test-router-swap.js`** - Tests router swap functionality
- **`test-quote.js`** - Tests quote calculation
- **`test-manual-quote.js`** - Manual quote calculation testing
- **`check-router-functions.js`** - Verifies router contract functions
- **`check-pool.js`** - Checks liquidity pool status
- **`check-ytk.js`** - Verifies YTK token contract
- **`debug-router.js`** - Debugs router contract issues
- **`debug-pair-contract.js`** - Debugs pair contract issues
- **`find-ytk.js`** - Finds YTK token address
- **`check-init-code-hash.js`** - Checks INIT_CODE_PAIR_HASH issues

### Documentation
- **`deploy-guide.md`** - General deployment guide
- **`deploy-router-instructions.md`** - Step-by-step router deployment

## Usage

To run any script:

```bash
cd Uniswap-lite FE
node scripts/<script-name>.js
```

## Environment Variables

Most scripts require these environment variables:
- `PRIVATE_KEY` - Your wallet private key
- `RPC_URL` - Forma testnet RPC URL (default: https://rpc.sketchpad-1.forma.art)

## Important Addresses

- **Router**: `0x1687ecad448aB465ED427490167BC18D83D294aE` (Secure Router)
- **Factory**: `0x956777444Ac3C88Dea94a7e12f0004Deb574DD0d`
- **WTIA**: `0xBae5E4D473FdAAc18883850c56857Be7874b7B9c`
- **YTK**: `0x00822A3c6CA0E9944B3fc4b79849fa20037fa2C6`

## Security Notes

The secure router includes additional security checks:
- Only allows TIA ↔ YTK swaps
- Validates pair addresses
- Prevents unauthorized pair access
- Includes proper slippage protection
