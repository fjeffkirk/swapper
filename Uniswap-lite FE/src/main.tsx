import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Providers from './providers/PrivyProvider'
import App from './App'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { theme } from './theme'
import './index.css'

const qc = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Providers>
        <QueryClientProvider client={qc}>
          <App />
        </QueryClientProvider>
      </Providers>
    </ThemeProvider>
  </React.StrictMode>,
)
