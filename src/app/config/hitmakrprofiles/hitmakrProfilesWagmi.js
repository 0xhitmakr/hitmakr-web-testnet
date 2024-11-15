"use client"

import { 
  useReadContract,
  useWriteContract,
} from 'wagmi'
import { useAccount } from 'wagmi'
import abi from "./abi/abi"

const PROFILES_ADDRESS = process.env.NEXT_PUBLIC_HITMAKR_PROFILES_ADDRESS


export const useRegister = () => {
  const { writeContract, isPending, data } = useWriteContract()
  const { isConnected } = useAccount()

  const register = async (name) => {
    if (!name) throw new Error('Name is required')
    
    try {
      writeContract({
        address: PROFILES_ADDRESS,
        abi,
        functionName: 'register',
        args: [name],
        enabled: isConnected,
      })
    } catch (error) {
      console.error('Error registering profile:', error)
      throw error
    }
  }

  return { register, isPending, data }
}


export const useHasProfile = (address) => {
  const { isConnected } = useAccount()
  
  return useReadContract({
    address: PROFILES_ADDRESS,
    abi,
    functionName: 'hasProfile',
    args: [address],
    enabled: isConnected && Boolean(address),
  })
}


export const useProfileAddressByName = (name) => {
  const { isConnected } = useAccount()

  return useReadContract({
    address: PROFILES_ADDRESS,
    abi,
    functionName: 'profileAddressByName',
    args: [name],
    enabled: isConnected && Boolean(name),
  })
}


export const useNameByAddress = (address) => {
  const { isConnected } = useAccount()

  return useReadContract({
    address: PROFILES_ADDRESS,
    abi,
    functionName: 'nameByAddress',
    args: [address],
    enabled: isConnected && Boolean(address),
  })
}


export const useProfileCount = () => {
  const { isConnected } = useAccount()

  return useReadContract({
    address: PROFILES_ADDRESS,
    abi,
    functionName: 'profileCount',
    enabled: isConnected,
  })
}


export const useTokenURI = (tokenId) => {
  const { isConnected } = useAccount()

  return useReadContract({
    address: PROFILES_ADDRESS,
    abi,
    functionName: 'tokenURI',
    args: [tokenId],
    enabled: isConnected && tokenId !== undefined,
  })
}


export const useOwnerOf = (tokenId) => {
  const { isConnected } = useAccount()

  return useReadContract({
    address: PROFILES_ADDRESS,
    abi,
    functionName: 'ownerOf',
    args: [tokenId],
    enabled: isConnected && tokenId !== undefined,
  })
}


export const useBalanceOf = (address) => {
  const { isConnected } = useAccount()

  return useReadContract({
    address: PROFILES_ADDRESS,
    abi,
    functionName: 'balanceOf',
    args: [address],
    enabled: isConnected && Boolean(address),
  })
}