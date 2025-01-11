import { getCsrfToken, signIn, signOut, getSession } from "next-auth/react";
import { createSIWEConfig, formatMessage } from "@reown/appkit-siwe";
import { skaleCalypsoTestnet } from "viem/chains";
import { campNetworkTestnetV2 } from "@/app/config/appkit/AppKitConfig";
import { getAddress } from "viem";

// Normalize the address (checksum)
const normalizeAddress = (address) => {
  try {
    const splitAddress = address.split(":");
    const extractedAddress = splitAddress[splitAddress.length - 1];
    const checksumAddress = getAddress(extractedAddress);
    splitAddress[splitAddress.length - 1] = checksumAddress;
    const normalizedAddress = splitAddress.join(":");

    return normalizedAddress;
  } catch (error) {
    return address;
  }
};


export const siweConfig = createSIWEConfig({
  getMessageParams: async () => ({
    domain: typeof window !== 'undefined' ? window.location.host : '',
    uri: typeof window !== 'undefined' ? window.location.origin : '',
    chains: [skaleCalypsoTestnet.id, campNetworkTestnetV2.id],
    statement: 'Please sign with your account'
  }),

  createMessage: ({ address, ...args }) => formatMessage(args, normalizeAddress(address)),

  getNonce: async () => {
    const nonce = await getCsrfToken()
    if (!nonce) {
      throw new Error('Failed to get nonce!')
    }
    return nonce
  },
  getSession: async () => {
    const session = await getSession();
    if (!session) {
      return null;
    }
    
    // Validate address and chainId types
    if (typeof session.address !== "string" || typeof session.chainId !== "number") {
      return null;
    }

    return { address: session.address, chainId: session.chainId };
  },
  verifyMessage: async ({ message, signature }) => {
    try {
      const success = await signIn('credentials', {
        message,
        redirect: false,
        signature,
        callbackUrl: '/protected'
      })

      return Boolean(success?.ok)
    } catch (error) {
      return false
    }
  },
  signOut: async () => {
    try {
      await signOut({
        redirect: false
      })

      return true
    } catch (error) {
      return false
    }
  }
})