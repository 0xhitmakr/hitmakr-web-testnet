import { 
    useReadContract,
    useWriteContract,
    useReadContracts
} from 'wagmi'
import { useAccount } from 'wagmi'
import { useSkaleChainValidation } from '@/app/helpers/SkaleChainValidation'
import abi from "./abi/abi"

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_HITMAKR_CREATIVE_ID_ADDRESS


export const useRegisterCreativeID = () => {
    const { writeContract, isPending, data } = useWriteContract()
    const { isConnected } = useAccount()
    const { validateAndSwitchChain, isSwitchingChain, isValidChain } = useSkaleChainValidation()
    
    const { data: isPaused } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: 'paused',
        enabled: isConnected,
    })

    const register = async (countryCode, registryCode) => {
        if (!countryCode || !registryCode) throw new Error('Required fields missing')
        if (countryCode.length !== 2) throw new Error('Invalid country code length')
        if (registryCode.length !== 5) throw new Error('Invalid registry code length')
        if (isPaused) throw new Error('Contract is paused')
        
        try {
            const isChainValid = await validateAndSwitchChain()
            if (!isChainValid) return

            writeContract({
                address: CONTRACT_ADDRESS,
                abi,
                functionName: 'register',
                args: [countryCode, registryCode],
                enabled: isConnected && !isPaused,
            })
        } catch (error) {
            console.error('Error registering Creative ID:', error)
            throw error
        }
    }

    return { 
        register, 
        isPending: isPending || isSwitchingChain, 
        data,
        isValidChain,
        isPaused 
    }
}


const formatCreativeIDResponse = (data) => {
    if (!data || data.length !== 3) return null
    return {
        id: data[0] || "",
        timestamp: Number(data[1]) || 0,
        exists: Boolean(data[2]) && data[0] !== ""
    }
}


export const useCreativeID = (address) => {
    const { isConnected } = useAccount()
    const { isValidChain } = useSkaleChainValidation()

    const responses = useReadContracts({
        contracts: [
            {
                address: CONTRACT_ADDRESS,
                abi,
                functionName: 'getCreativeID',
                args: [address],
                enabled: isConnected && Boolean(address),
            },
            {
                address: CONTRACT_ADDRESS,
                abi,
                functionName: 'paused',
                enabled: isConnected,
            }
        ]
    })

    const formattedData = formatCreativeIDResponse(responses.data?.[0])
    const isPaused = responses.data?.[1] || false

    return {
        ...responses,
        data: formattedData,
        isPaused,
        isValidChain
    }
}


export const useHasCreativeID = (address) => {
    const { isConnected } = useAccount()
    const { isValidChain } = useSkaleChainValidation()

    const responses = useReadContracts({
        contracts: [
            {
                address: CONTRACT_ADDRESS,
                abi,
                functionName: 'hasCreativeID',
                args: [address],
                enabled: isConnected && Boolean(address),
            },
            {
                address: CONTRACT_ADDRESS,
                abi,
                functionName: 'paused',
                enabled: isConnected,
            }
        ]
    })

    return {
        ...responses,
        data: responses.data?.[0],
        isPaused: responses.data?.[1] || false,
        isValidChain
    }
}


export const useIsCreativeIDTaken = (creativeID) => {
    const { isConnected } = useAccount()
    const { isValidChain } = useSkaleChainValidation()
    const isValidCreativeID = Boolean(creativeID && creativeID.length === 7)

    const responses = useReadContracts({
        contracts: [
            {
                address: CONTRACT_ADDRESS,
                abi,
                functionName: 'isCreativeIDTaken',
                args: [creativeID],
                enabled: isConnected && isValidCreativeID,
            },
            {
                address: CONTRACT_ADDRESS,
                abi,
                functionName: 'paused',
                enabled: isConnected,
            }
        ]
    })

    return {
        ...responses,
        data: responses.data?.[0],
        isPaused: responses.data?.[1] || false,
        isValidChain
    }
}

export const useTotalCreativeIDs = () => {
    const { isConnected } = useAccount()
    const { isValidChain } = useSkaleChainValidation()

    const responses = useReadContracts({
        contracts: [
            {
                address: CONTRACT_ADDRESS,
                abi,
                functionName: 'getTotalCreativeIDs',
                enabled: isConnected,
            },
            {
                address: CONTRACT_ADDRESS,
                abi,
                functionName: 'paused',
                enabled: isConnected,
            }
        ]
    })

    return {
        ...responses,
        data: Number(responses.data?.[0]) || 0,
        isPaused: responses.data?.[1] || false,
        isValidChain
    }
}


export const useToggleEmergencyPause = () => {
    const { writeContract, isPending, data } = useWriteContract()
    const { isConnected } = useAccount()
    const { validateAndSwitchChain, isSwitchingChain, isValidChain } = useSkaleChainValidation()

    const togglePause = async () => {
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
            console.error('Error toggling pause:', error)
            throw error
        }
    }

    return { 
        togglePause, 
        isPending: isPending || isSwitchingChain, 
        data,
        isValidChain 
    }
}