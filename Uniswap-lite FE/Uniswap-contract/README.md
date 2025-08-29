# Uniswap V2 on Forma Sketchpad  Single Market (YTKTIA)

## 0) Prereqs
- Foundry installed: `curl -L https://foundry.paradigm.xyz | bash && foundryup`
- A funded testnet key with TIA on Forma Sketchpad.

## 1) Init repo and libs
```bash
mkdir forma-v2 && cd forma-v2
forge init --no-commit
git submodule add https://github.com/Uniswap/v2-core.git lib/v2-core
git submodule add https://github.com/Uniswap/v2-periphery.git lib/v2-periphery
git submodule add https://github.com/weth-protocol/weth.git lib/weth9
cp .env.example .env
```

## 2) Compute INIT_CODE_HASH and set it
```bash
forge script script/PairHash.s.sol
# Copy the printed bytes32 into:
# lib/v2-periphery/contracts/libraries/UniswapV2Library.sol
#   bytes32 internal constant INIT_CODE_HASH = 0x<printed_hash>;
forge build
```

## 3) Export environment
```bash
export RPC_FORMA=https://rpc.sketchpad-1.forma.art
export CHAIN_ID=984123
export PRIVATE_KEY=0xYOUR_TEST_PRIVATE_KEY
# Optional: if you already have WTIA
# export WTIA_ADDRESS=0x...  # put canonical wrapped TIA here
```

## 4) Deploy WTIA (if needed), Factory, Router, and YTK
```bash
forge script src/Deploy.s.sol:DeployV2   --rpc-url $RPC_FORMA   --chain-id $CHAIN_ID   --private-key $PRIVATE_KEY   --broadcast
# Save printed addresses:
# WTIA, Factory, Router, YTK
export ROUTER=0x...   # from logs
export YTK=0x...      # from logs
```

## 5) Add initial liquidity (YTK + TIA)
```bash
forge script script/AddLiquidity.s.sol:AddLiquidity   --rpc-url $RPC_FORMA   --chain-id $CHAIN_ID   --private-key $PRIVATE_KEY   --broadcast
```

## 6) Try swaps both directions
```bash
forge script script/Swap.s.sol:SwapOneHop   --rpc-url $RPC_FORMA   --chain-id $CHAIN_ID   --private-key $PRIVATE_KEY   --broadcast
```

## Notes
- Pairs are ERC-20 only. The on-chain pool is YTKWTIA; the router wraps/unwraps TIA so users only see TIA.
- Keep a single market by only exposing the YTKTIA route in your UI.
- For production, prefer a canonical WTIA address to avoid liquidity fragmentation.
