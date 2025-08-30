# Deploy New Uniswap V2 Router

## Problem
The current router contract (`0x52FfddaD55fa773b4f127159E02C4C9B0cF54717`) has a bug in the `getAmountsOut` function, causing all quote requests and swaps to fail.

## Solution
Deploy a new router contract using the working Uniswap V2 Router02 implementation.

## Deployment Steps

### 1. Set Environment Variables
```bash
export PRIVATE_KEY="your_private_key_here"
```

### 2. Run Deployment Script
```bash
node deploy-router.js
```

### 3. Update Frontend
After successful deployment, update the frontend with the new router address:

**File: `src/App.tsx`**
```typescript
const ROUTER = "0x[new_router_address_here]";
```

**File: `src/config/wagmi.ts`** (if needed)
```typescript
// Update any hardcoded router addresses
```

## Expected Output
```
🚀 Deploying new Uniswap V2 Router...
Deployer address: 0x...
Factory address: 0x956777444Ac3C88Dea94a7e12f0004Deb574DD0d
WETH address: 0xBae5E4D473FdAAc18883850c56857Be7874b7B9c
⏳ Waiting for deployment...
✅ Router deployed at: 0x[new_router_address]
🎉 Router deployment successful!
📋 Summary:
   Router: 0x[new_router_address]
   Factory: 0x956777444Ac3C88Dea94a7e12f0004Deb574DD0d
   WETH: 0xBae5E4D473FdAAc18883850c56857Be7874b7B9c
🎯 Update your frontend with this router address: 0x[new_router_address]
```

## Verification
After deployment, test the new router:

```bash
node test-router-swap.js
```

The new router should:
- ✅ Have working `getAmountsOut` function
- ✅ Support proper quote calculations
- ✅ Enable successful swap transactions

## Current Status
- ✅ Deployment script ready (`deploy-router.js`)
- ✅ Test script ready (`test-router-swap.js`)
- ✅ Frontend integration prepared
- ⏳ Waiting for private key to execute deployment
