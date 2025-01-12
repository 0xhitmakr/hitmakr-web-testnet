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
import { CloudAuthSIWX } from '@reown/appkit-siwx'

const queryClient = new QueryClient();

export const appKitModal = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  metadata,
  projectId,
  // siweConfig: siweConfig,
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
  siwx: new CloudAuthSIWX()
});

export function AppKitProvider({ children }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
          {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default AppKitProvider;
