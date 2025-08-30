# 🚀 Add Liquidity to Your Uniswap Pool

## ✅ Current Status
- ✅ Router: `0x52FfddaD55fa773b4f127159E02C4C9B0cF54717`
- ✅ WTIA: `0xBae5E4D473FdAAc18883850c56857Be7874b7B9c`
- ✅ YTK: `0x00822a3c6c0ae9944b3fc4b79849fa20037fa2c6`
- ❌ **Missing**: Liquidity pool for TIA ↔ YTK trading

## 🏊 Two Ways to Add Liquidity

### Option 1: JavaScript Script (Easier)
```bash
# Navigate to the frontend directory
cd Uniswap-lite FE

# Set your private key and run the script
export PRIVATE_KEY=0x18bfa2ded8e427981c2e86a5fc4c6f67bdbf29b2783e099e5edc73eceff95375
node add-liquidity-fixed.js
```

### Option 2: Foundry Script (More Reliable)
```bash
# Navigate to the contracts directory
cd Uniswap-lite FE/Uniswap-contract

# Set environment variables
export RPC_FORMA=https://rpc.sketchpad-1.forma.art
export CHAIN_ID=984123
export PRIVATE_KEY=0x18bfa2ded8e427981c2e86a5fc4c6f67bdbf29b2783e099e5edc73eceff95375

# Run the liquidity script
forge script script/AddLiquidity.s.sol:AddLiquidity --rpc-url $RPC_FORMA --chain-id $CHAIN_ID --private-key $PRIVATE_KEY --broadcast
```

## 📋 What Happens When You Add Liquidity

The script will:
1. ✅ Check your TIA and YTK balances
2. ✅ Approve YTK spending for the router
3. ✅ Add 1 TIA + 1000 YTK to create the pool
4. ✅ Show transaction hash and explorer link

## 🔍 Verify Success

After adding liquidity, check the pool:
```bash
cd Uniswap-lite FE
node check-pool.js
```

You should see:
```
✅ Pair exists!
Token0: 0xBae5E4D473FdAAc18883850c56857Be7874b7B9c Reserve0: 1.0
Token1: 0x00822a3c6c0ae9944b3fc4b79849fa20037fa2c6 Reserve1: 1000.0
✅ getAmountsOut works!
```

## 🎯 Result

Once liquidity is added, your swap will work and show:
- **Buy (Estimated)**: Calculated YTK amount for TIA input
- **Minimum received**: Amount with slippage protection

## 🔧 Troubleshooting

### "insufficient funds"
- Make sure you have at least 1 TIA + 1000 YTK in your wallet

### "execution reverted"
- Check that the contracts are properly deployed
- Try with smaller amounts first

### Still not working?
- Run `node check-pool.js` to see the current pool state
- Check transaction on Forma Explorer: https://explorer.sketchpad-1.forma.art
