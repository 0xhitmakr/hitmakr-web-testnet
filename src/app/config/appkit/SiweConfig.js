// app/config/appkit/SiweConfig.js
import { createSIWEConfig, formatMessage } from "@reown/appkit-siwe";
import { skaleCalypsoTestnet } from "viem/chains";
import { campNetworkTestnetV2 } from "@/app/config/appkit/AppKitConfig";



export const siweConfig = createSIWEConfig({
  getMessageParams: async () => ({
    domain: typeof window !== 'undefined' ? window.location.host : '',
    uri: typeof window !== 'undefined' ? window.location.origin : '',
    chains: [skaleCalypsoTestnet.id, campNetworkTestnetV2.id],
    statement: 'Please sign with your account'
  }),

  createMessage: ({ address, ...args }) => formatMessage(args, address),

  getNonce: async () => {
    const res = await fetch(`/api/auth/nonce`, { method: 'GET' });
    if (!res.ok) throw new Error('Failed to fetch SIWE nonce');
    return res.text();
  },
  getSession: async () => {
    const res = await fetch(`/api/auth/session`, { method: "GET" });
      if (!res.ok) throw new Error('Failed to fetch SIWE session');
  
      const { address, chainId } = await res.json();
      return address && chainId ? { address, chainId } : null;
  },
  verifyMessage: async ({ message, signature }) => {
    const res = await fetch(`/api/auth/verify`, {
        method: 'POST',
        body: JSON.stringify({ message, signature }),
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (res.ok ) {
        const { token } = await res.json();

        console.log('\n\n\nVerify Message Token:')
        console.log(token)
        console.log('\n\n\n')

        
        if (token) {
          localStorage.setItem('authToken', token);
        }
      }
      
      return res.ok;
  },
  signOut: async () => {
    const res = await fetch(`/api/auth/signout`, { method: 'POST' });
      if (res.ok) {
        localStorage.removeItem('authToken');
      }
      return res.ok;
  }
})