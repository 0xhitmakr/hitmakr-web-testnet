"use client"

import React from "react";
import { WagmiProvider, createConfig } from 'wagmi';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { skaleCalypsoTestnet } from 'viem/chains';
import { ConnectKitProvider, getDefaultConfig, SIWEProvider } from 'connectkit';
import ConnectKitAvatarConfig from "./ConnecKitAvatarConfig";
import { walletConnectID } from "@/lib/secure/Config";
import { SiweMessage } from 'siwe';

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
	  default: { name: "Blockscout", url: "https://camp-network-testnet.blockscout.com" },
	},
	testnet: true,
};
  

const config = createConfig(
	getDefaultConfig({
		appName: "Hitmakr",
		chains: [skaleCalypsoTestnet,campNetworkTestnetV2],
		walletConnectProjectId: walletConnectID,
		appDescription: "Hitmakr: Explore music on Web3",
		appUrl: "https://hitmakr.io",
        appIcon: "https://gold-select-penguin-939.mypinata.cloud/ipfs/Qmd6qEc8AymzNKExFpTPTnPi3ivWyUv4QaJicp9Zfj3Agv",
	})
);


const siweConfig = {
	
	getNonce: async () => {
	  const res = await fetch(`/siwe`, { method: 'PUT' });
	  if (!res.ok) throw new Error('Failed to fetch SIWE nonce');
	  return res.text();
	},
	
	
	createMessage: ({ nonce, address, chainId }) => {
	  return new SiweMessage({
		nonce,
		chainId,
		address,
		version: '1',
		uri: window.location.origin,
		domain: window.location.host,
		statement: 'Hitmakr Signature Authentication. Click Sign-In and accept the Hitmakr Terms of Service (https://mirror.xyz/0xB5e80530244F95F4290aD33f5fA5cB28B73B4593/exKwR0S3ejOjAgEQsgXxfNJMsInKMpJiaez1mUiMmqE) and Privacy Policy (https://mirror.xyz/0xB5e80530244F95F4290aD33f5fA5cB28B73B4593/XhqhggYwVjA69c4rc6-vtUOqsp0Q0zJkrHL-Q1OIiXc). This request will not trigger a blockchain transaction or cost any gas fees.',
	  }).prepareMessage();
	},
	
	
	verifyMessage: async ({ message, signature }) => {
	  const res = await fetch(`/siwe`, {
		method: 'POST',
		body: JSON.stringify({ message, signature }),
		headers: { 'Content-Type': 'application/json' },
	  });
	  
	  if (res.ok) {
		const { token } = await res.json();
		if (token) {
		  localStorage.setItem('authToken', token);
		}
	  }
	  
	  return res.ok;
	},
	
	
	getSession: async () => {
	  const res = await fetch(`/siwe`);
	  if (!res.ok) throw new Error('Failed to fetch SIWE session');
  
	  const { address, chainId } = await res.json();
	  return address && chainId ? { address, chainId } : null;
	},
	
	
	signOut: async () => {
	  const res = await fetch(`/siwe`, { method: 'DELETE' });
	  if (res.ok) {
		localStorage.removeItem('authToken');
	  }
	  return res.ok;
	}
};


const queryClient = new QueryClient();


export const HitmakrConnectKitProvider = ({children}) => {
    return(
		<WagmiProvider config={config} >
			<QueryClientProvider client={queryClient} >   
				<SIWEProvider {...siweConfig} 
					signOutOnNetworkChange={false}
					>
					<ConnectKitProvider 
						theme="midnight"
					 	options={{ customAvatar: ConnectKitAvatarConfig, }} 
					 	customTheme={{ "--ck-font-family": '"Nunito", sans-serif', }} 
						>
						{children}
					</ConnectKitProvider>
				</SIWEProvider>
			</QueryClientProvider>
		</WagmiProvider>
    );
}
