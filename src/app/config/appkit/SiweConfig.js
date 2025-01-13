import { createSIWEConfig, formatMessage } from "@reown/appkit-siwe";
import { skaleCalypsoTestnet } from "viem/chains";
import { campNetworkTestnetV2 } from "@/app/config/appkit/AppKitConfig";

const isServer = typeof window === 'undefined';

export const siweConfig = createSIWEConfig({
  getMessageParams: async () => ({
    domain: isServer ? process.env.NEXT_PUBLIC_DOMAIN : window.location.host,
    uri: isServer ? process.env.NEXT_PUBLIC_BASE_URL : window.location.origin,
    chains: [skaleCalypsoTestnet.id, campNetworkTestnetV2.id],
    statement: 'Please sign with your account',
  }),

  createMessage: ({ address, ...args }) => formatMessage(args, address),

  getNonce: async () => {
    const baseUrl = isServer ? process.env.NEXT_PUBLIC_BASE_URL : '';
    const res = await fetch(`${baseUrl}/api/auth/nonce`, { method: 'GET' });
    if (!res.ok) throw new Error('Failed to fetch SIWE nonce');
    return res.text();
  },

  getSession: async () => {
    const baseUrl = isServer ? process.env.NEXT_PUBLIC_BASE_URL : '';
    const res = await fetch(`${baseUrl}/api/auth/session`, { method: "GET" });
    if (!res.ok) throw new Error('Failed to fetch SIWE session');

    const { address, chainId } = await res.json();
    return address && chainId ? { address, chainId } : null;
  },

  verifyMessage: async ({ message, signature }) => {
    const baseUrl = isServer ? process.env.NEXT_PUBLIC_BASE_URL : '';
    const res = await fetch(`${baseUrl}/api/auth/verify`, {
      method: 'POST',
      body: JSON.stringify({ message, signature }),
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (res.ok) {
      const { token } = await res.json();

      if (token) {
        localStorage.setItem('authToken', token);
      }
    }

    return res.ok;
  },

  signOut: async () => {
    const baseUrl = isServer ? process.env.NEXT_PUBLIC_BASE_URL : '';
    const res = await fetch(`${baseUrl}/api/auth/signout`, { method: 'POST' });
    if (res.ok) {
      localStorage.removeItem('authToken');
    }
    return res.ok;
  },
});
