'use client'

import { wagmiAdapter, projectId, networks, metadata, siwxConfig, config } from './appkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import { skaleCalypsoTestnet } from '@reown/appkit/networks'
import React from 'react'
import { cookieToInitialState, WagmiProvider } from 'wagmi'

const queryClient = new QueryClient()

if (!projectId) {
  throw new Error('Project ID is not defined')
}

const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks,
  defaultNetwork: skaleCalypsoTestnet,
  metadata,
  siwx: siwxConfig,
  features: {
    analytics: true,
    email: false,
    socials: false,
    emailShowWallets: false, 
  },
  allWallets: 'SHOW',
  themeVariables: {
    '--w3m-color-mix': '#202020',
    '--w3m-color-mix-strength': 40,
    '--w3m-font-family': '"Parkinsans", sans-serif',
  }
})

function AppKitProvider({ children, cookies }) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig, cookies)

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default AppKitProvider