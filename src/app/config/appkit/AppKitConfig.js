
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { walletConnectID as projectId } from "@/lib/secure/Config";
import { skaleCalypsoTestnet } from "viem/chains";


if (!projectId) {
  throw new Error("Project ID is not defined");
}

export const campNetworkTestnetV2 = {
  id: 325000,
  name: "Camp Network Testnet V2",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: { http: ["https://rpc-campnetwork.xyz"] },
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://camp-network-testnet.blockscout.com",
    },
  },
  testnet: true,
};

export const networks = [skaleCalypsoTestnet, campNetworkTestnetV2];


//Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
  ssr: true,
});


export const config = wagmiAdapter.wagmiConfig;

// Set up metadata
export const metadata = {
  name: "Hitmakr",
  description: "Hitmakr: Explore music on Web3",
  url:
    typeof window !== "undefined"
      ? window.location.origin
      : "https://hitmakr.io", // or try 'http://localhost:3000'
  icons: [
    "https://gold-select-penguin-939.mypinata.cloud/ipfs/Qmd6qEc8AymzNKExFpTPTnPi3ivWyUv4QaJicp9Zfj3Agv",
  ],
};


