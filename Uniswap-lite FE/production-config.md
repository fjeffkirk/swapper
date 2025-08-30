# 🚀 Production Deployment Configuration

## Environment Variables for Render

Copy these environment variables to your **Render Dashboard** → **Environment**:

```
# Network Configuration
VITE_NETWORK=sketchpad
VITE_CHAIN_ID=984123
VITE_CHAIN_NAME=Forma Sketchpad
VITE_CHAIN_RPC=https://rpc.sketchpad-1.forma.art
VITE_CHAIN_EXPLORER_NAME=Forma Explorer
VITE_CHAIN_EXPLORER_URL=https://explorer.sketchpad-1.forma.art/

# Privy Configuration (Production App ID)
VITE_PRIVY_APP_ID_PROD=clyd28wj504pvrnubbcqjlpgl

# Contract Addresses
VITE_FACTORY=0x956777444Ac3C88Dea94a7e12f0004Deb574DD0d
VITE_ROUTER=0x592a36b069843cbaEB0df6FA1cFae5009418E45d
VITE_WTIA=0xBae5E4D473FdAAc18883850c56857Be7874b7B9c
VITE_YTK=0x00822A3c6CA0E9944B3fc4b79849fa20037fa2C6
```

## Build Command

Set your **Build Command** in Render to:
```bash
npm run build
```

## Start Command

Set your **Start Command** in Render to:
```bash
npm run preview
```

## HTTPS Requirement

**CRITICAL**: Ensure your Render deployment uses **HTTPS**:
1. Go to Render Dashboard → Your Service → Settings
2. Under "Custom Domains", make sure you have a custom domain with SSL
3. Or use Render's auto-generated domain (which should have HTTPS by default)

## Troubleshooting

If wallet connection still doesn't work:

1. **Check Console**: Open browser dev tools and check for errors
2. **Verify HTTPS**: Ensure the site loads with `https://`
3. **Check Environment Variables**: Verify all variables are set in Render
4. **Clear Cache**: Try clearing browser cache and reconnecting wallet
5. **Network Switch**: Make sure your wallet is on the correct network

## Wallet Compatibility

Most Web3 wallets require HTTPS in production environments. The following wallets are supported:
- MetaMask
- Coinbase Wallet
- Trust Wallet
- WalletConnect compatible wallets

## Testing

Test your deployed version by:
1. Opening the Render URL in a new incognito window
2. Connecting your wallet
3. Trying a small swap transaction
