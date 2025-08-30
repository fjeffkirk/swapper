# Uniswap V2 on Forma Sketchpad (Single Market: YTK/TIA)

## Prerequisites
- Install Foundry
```bash
curl -L https://foundry.paradigm.xyz | bash && foundryup
```
- A funded testnet key with TIA on Forma Sketchpad.

## 1) Init repo and libraries
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
```
Copy the printed bytes32 into `lib/v2-periphery/contracts/libraries/UniswapV2Library.sol`:
```solidity
bytes32 internal constant INIT_CODE_HASH = 0x<printed_hash>;
```
Then build:
```bash
forge build
```

## 3) Environment
```bash
export RPC_FORMA=https://rpc.sketchpad-1.forma.art
export CHAIN_ID=984123
export PRIVATE_KEY=0xYOUR_TEST_PRIVATE_KEY
# Optional: if you already have WTIA
# export WTIA_ADDRESS=0x...  # canonical wrapped TIA
```

## 4) Deploy WTIA (optional), Factory, Router, YTK
```bash
forge script src/Deploy.s.sol:DeployV2 \
  --rpc-url $RPC_FORMA \
  --chain-id $CHAIN_ID \
  --private-key $PRIVATE_KEY \
  --broadcast
```
Save printed addresses (WTIA, Factory, Router, YTK) and export for the FE if needed.

## 5) Add initial liquidity (YTK + TIA)
```bash
forge script script/AddLiquidity.s.sol:AddLiquidity \
  --rpc-url $RPC_FORMA \
  --chain-id $CHAIN_ID \
  --private-key $PRIVATE_KEY \
  --broadcast
```

## 6) Try swaps (both directions)
```bash
forge script script/Swap.s.sol:SwapOneHop \
  --rpc-url $RPC_FORMA \
  --chain-id $CHAIN_ID \
  --private-key $PRIVATE_KEY \
  --broadcast
```

## Notes
- Pools are ERC-20 only. On-chain pool is `YTK/WTIA`; the router wraps/unwraps TIA so users see TIA.
- Keep a single market by exposing only the YTK/TIA route in the UI.
- For production, prefer a canonical WTIA address to avoid liquidity fragmentation.