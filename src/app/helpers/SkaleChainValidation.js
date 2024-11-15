"use client"

import { useChainId, useSwitchChain } from 'wagmi'
import { skaleChainId } from '@/lib/secure/Config'

export const useSkaleChainValidation = () => {
  const chainId = useChainId()
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain()

  const validateAndSwitchChain = async () => {
    if (chainId !== skaleChainId) {
      await switchChain({ chainId: skaleChainId })
      return false
    }
    return true
  }

  return {
    isValidChain: chainId === skaleChainId,
    validateAndSwitchChain,
    isSwitchingChain,
    chainId
  }
}