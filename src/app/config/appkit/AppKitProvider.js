// app/config/appkit/AppKitProvider.js
"use client";

import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAppKit } from "@reown/appkit/react";
import { walletConnectProjectId as projectId } from "@/lib/secure/Config";
import {
  metadata,
  networks,
  wagmiAdapter,
} from "@/app/config/appkit/AppKitConfig";
import { siweConfig } from "./SiweConfig";
import SIWEProvider from "./SIWEProvider";

const queryClient = new QueryClient();

const siwxConfig = {
  createMessage: async (input) => {
    // Implement your logic to create a message
    return "my message";
  },
  addSession: async (session) => {
    // Implement your logic to add a session
  },
  revokeSession: async (chainId, address) => {
    // Implement your logic to revoke a session
  },
  setSessions: async (sessions) => {
    // Implement your logic to set sessions
  },
  getSessions: async (chainId, address) => {
    // Implement your logic to get sessions
    return [];
  },
};

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

export function AppKitProvider({ children }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <SIWEProvider>{children}</SIWEProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default AppKitProvider;
