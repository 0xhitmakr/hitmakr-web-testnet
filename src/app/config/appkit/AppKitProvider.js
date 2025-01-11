"use client";

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAppKit } from "@reown/appkit/react";
import { cookieToInitialState, WagmiProvider } from "wagmi";
import { walletConnectID as projectId } from "@/lib/secure/Config";
import { metadata, networks, wagmiAdapter } from "./AppKitConfig";
import { siweConfig } from "./SiweConfigLegacy";


// Set up queryClient
const queryClient = new QueryClient();

export const appKitModal = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  metadata,
  projectId,
  siweConfig: siweConfig,
  features: {
    email: true,
    socials: ["google", "discord", "github"],
    emailShowWallets: true,
    analytics: true,
  },
  allWallets: "SHOW",
  themeMode: "dark",
  themeVariables: {
    "--w3m-font-family": '"Nunito", sans-serif',
  },
});

function AppKitProvider({ children }) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig);

  return (
    <WagmiProvider
      config={wagmiAdapter.wagmiConfig}
      initialState={initialState}
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}

export default AppKitProvider;
