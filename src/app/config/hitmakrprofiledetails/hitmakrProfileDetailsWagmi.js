"use client";

import {
    useWriteContract,
} from 'wagmi'
import { useAccount } from 'wagmi'
import { useSkaleChainValidation } from '@/app/helpers/SkaleChainValidation'
import abi from "./abi/abi" // Make sure this path is correct

const PROFILE_DETAILS_ADDRESS = process.env.NEXT_PUBLIC_HITMAKR_PROFILE_DETAILS_ADDRESS

export const useSetProfileDetails = () => {
    const { writeContract, isPending, data } = useWriteContract()
    const { isConnected } = useAccount()
    const { validateAndSwitchChain, isSwitchingChain, isValidChain } = useSkaleChainValidation()

    const setProfileDetails = async (fullName, imageURI, bio, dateOfBirth, country) => {
        if (!fullName || !dateOfBirth || !country) throw new Error('Required fields missing')

        try {
            const isChainValid = await validateAndSwitchChain()
            if (!isChainValid) return

            writeContract({
                address: PROFILE_DETAILS_ADDRESS,
                abi,
                functionName: 'setProfileDetails',
                args: [fullName, imageURI, bio, dateOfBirth, country],
                enabled: isConnected,
            })
        } catch (error) {
            console.error('Error setting profile details:', error)
            throw error
        }
    }

    return {
        setProfileDetails,
        isPending: isPending || isSwitchingChain,
        data,
        isValidChain
    }
}

export const useUpdateProfileDetails = () => {
    const { writeContract, isPending, data } = useWriteContract()
    const { isConnected } = useAccount()
    const { validateAndSwitchChain, isSwitchingChain, isValidChain } = useSkaleChainValidation()

    const updateProfileDetails = async (fullName, imageURI, bio, country) => {
        try {
            const isChainValid = await validateAndSwitchChain()
            if (!isChainValid) return

            writeContract({
                address: PROFILE_DETAILS_ADDRESS,
                abi,
                functionName: 'updateProfileDetails',
                args: [fullName, imageURI, bio, country],
                enabled: isConnected,
            })
        } catch (error) {
            console.error('Error updating profile details:', error)
            throw error
        }
    }

    return {
        updateProfileDetails,
        isPending: isPending || isSwitchingChain,
        data,
        isValidChain
    }
}