# 🚀 Uniswap V2 Deployment Guide

## ✅ Current Status
Your contracts are already deployed! Here's what we found:
- **Router**: `0x52FfddaD55fa773b4f127159E02C4C9B0cF54717` ✅
- **WTIA**: `0xBae5E4D473FdAAc18883850c56857Be7874b7B9c` ✅
- **YTK**: `0x00822a3c6c0ae9944b3fc4b79849fa20037fa2c6` ✅

## ❌ The Issue
**No liquidity pool exists** for the TIA ↔ YTK pair. You need to add liquidity first.

## 🏊 Add Liquidity (Quick Fix)

### 1. Set Your Private Key
```bash
export PRIVATE_KEY=0xyour_private_key_here
```

### 2. Run the Fixed Add Liquidity Script
```bash
node add-liquidity-fixed.js
```

This script will:
- ✅ Check your TIA and YTK balances
- ✅ Approve YTK spending
- ✅ Add 1 TIA + 1000 YTK to the pool
- ✅ Show transaction details

### 3. Verify Liquidity Was Added
After the script runs successfully, check the pool:
```bash
node check-pool.js
```

You should see:
```
✅ Pair exists!
Token0: 0xBae5E4D473FdAAc18883850c56857Be7874b7B9c Reserve0: 1.0
Token1: 0x00822a3c6c0ae9944b3fc4b79849fa20037fa2c6 Reserve1: 1000.0
✅ getAmountsOut works!
```

### 4. Restart Your App
```bash
npm run dev
```

## 🎯 Expected Result
After adding liquidity, your swap should work and show quotes like:
- **Buy (Estimated)**: Shows calculated YTK amount
- **Minimum received**: Shows amount with slippage applied

## 🔧 Troubleshooting

If you get "insufficient funds":
- Make sure you have at least 1 TIA + 1000 YTK in your wallet
- The script will show your current balances

If you get "execution reverted":
- Check that the contracts are properly deployed
- Try with smaller amounts first
