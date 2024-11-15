import { 
    useReadContract,
    useWriteContract,
} from 'wagmi'
import { useAccount } from 'wagmi'
import { useSkaleChainValidation } from '@/app/helpers/SkaleChainValidation'
import abi from "./abi/abi"

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_HITMAKR_VERIFICATION_ADDRESS


export const useSetVerification = () => {
    const { writeContract, isPending, data } = useWriteContract()
    const { isConnected } = useAccount()
    const { validateAndSwitchChain, isSwitchingChain, isValidChain } = useSkaleChainValidation()

    const setVerification = async (account, grant) => {
        if (!account) throw new Error('Address is required')
        
        try {
            const isChainValid = await validateAndSwitchChain()
            if (!isChainValid) return

            writeContract({
                address: CONTRACT_ADDRESS,
                abi,
                functionName: 'setVerification',
                args: [account, grant],
                enabled: isConnected,
            })
        } catch (error) {
            console.error('Error setting verification:', error)
            throw error
        }
    }

    return { 
        setVerification, 
        isPending: isPending || isSwitchingChain, 
        data,
        isValidChain 
    }
}


export const useBatchSetVerification = () => {
    const { writeContract, isPending, data } = useWriteContract()
    const { isConnected } = useAccount()
    const { validateAndSwitchChain, isSwitchingChain, isValidChain } = useSkaleChainValidation()

    const batchSetVerification = async (accounts, grant) => {
        if (!accounts || accounts.length === 0) throw new Error('Accounts array is required')
        if (accounts.length > 100) throw new Error('Batch size cannot exceed 100')
        
        try {
            const isChainValid = await validateAndSwitchChain()
            if (!isChainValid) return

            writeContract({
                address: CONTRACT_ADDRESS,
                abi,
                functionName: 'batchSetVerification',
                args: [accounts, grant],
                enabled: isConnected,
            })
        } catch (error) {
            console.error('Error batch setting verification:', error)
            throw error
        }
    }

    return { 
        batchSetVerification, 
        isPending: isPending || isSwitchingChain, 
        data,
        isValidChain 
    }
}


export const useToggleEmergencyPause = () => {
    const { writeContract, isPending, data } = useWriteContract()
    const { isConnected } = useAccount()
    const { validateAndSwitchChain, isSwitchingChain, isValidChain } = useSkaleChainValidation()

    const toggleEmergencyPause = async () => {
        try {
            const isChainValid = await validateAndSwitchChain()
            if (!isChainValid) return

            writeContract({
                address: CONTRACT_ADDRESS,
                abi,
                functionName: 'toggleEmergencyPause',
                enabled: isConnected,
            })
        } catch (error) {
            console.error('Error toggling emergency pause:', error)
            throw error
        }
    }

    return { 
        toggleEmergencyPause, 
        isPending: isPending || isSwitchingChain, 
        data,
        isValidChain 
    }
}


export const useIsVerified = (address) => {
    const { isConnected } = useAccount()
    const { isValidChain } = useSkaleChainValidation()

    return {
        ...useReadContract({
            address: CONTRACT_ADDRESS,
            abi,
            functionName: 'isVerified',
            args: [address],
            enabled: isConnected && Boolean(address),
        }),
        isValidChain
    }
}


export const useHitmakrControlCenter = () => {
    const { isConnected } = useAccount()
    const { isValidChain } = useSkaleChainValidation()

    return {
        ...useReadContract({
            address: CONTRACT_ADDRESS,
            abi,
            functionName: 'HITMAKR_CONTROL_CENTER',
            enabled: isConnected,
        }),
        isValidChain
    }
}

export const useHitmakrProfiles = () => {
    const { isConnected } = useAccount()
    const { isValidChain } = useSkaleChainValidation()

    return {
        ...useReadContract({
            address: CONTRACT_ADDRESS,
            abi,
            functionName: 'HITMAKR_PROFILES',
            enabled: isConnected,
        }),
        isValidChain
    }
}


export const useIsPaused = () => {
    const { isConnected } = useAccount()
    const { isValidChain } = useSkaleChainValidation()

    return {
        ...useReadContract({
            address: CONTRACT_ADDRESS,
            abi,
            functionName: 'paused',
            enabled: isConnected,
        }),
        isValidChain
    }
}