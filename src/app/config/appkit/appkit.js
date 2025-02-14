import { cookieStorage, createStorage, http } from '@wagmi/core'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { skaleCalypsoTestnet } from '@reown/appkit/networks'
import { CloudAuthSIWX } from '@reown/appkit-siwx'

export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID

if (!projectId) {
  throw new Error('Project ID is not defined')
}

export const networks = [skaleCalypsoTestnet]

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,
  projectId,
  networks,
  transports: {
    [skaleCalypsoTestnet.id]: http(),
  }
})

export const config = wagmiAdapter.wagmiConfig

export const metadata = {
    name: 'Hitmakr',
    description: 'Hitmakr: Explore music on Web3',
    url: typeof window !== "undefined"
    ? window.location.origin
    : "https://hitmakr.io",
    icons: ['https://gold-select-penguin-939.mypinata.cloud/ipfs/Qmd6qEc8AymzNKExFpTPTnPi3ivWyUv4QaJicp9Zfj3Agv']
}

export const siwxConfig = new CloudAuthSIWX()