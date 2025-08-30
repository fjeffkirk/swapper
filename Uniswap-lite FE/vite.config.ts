import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Build configuration optimized for production
  // Build configuration
  build: {
    sourcemap: false, // Reduce bundle size
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks for better caching
          vendor: ['react', 'react-dom'],
          web3: ['ethers', '@privy-io/react-auth', '@privy-io/wagmi', 'wagmi', 'viem'],
          ui: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
        },
      },
    },
  },
  // Define global constants
  define: {
    global: 'globalThis',
  },
})
