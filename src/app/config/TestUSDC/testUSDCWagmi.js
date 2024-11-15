"use client";

import { useState } from 'react';
import { useWriteContract, useAccount, useChainId, usePublicClient, useWalletClient, useSwitchChain } from 'wagmi';
import { skaleCalypsoTestnet } from 'viem/chains';
import { parseUnits } from 'viem';
import abi from './abi/abi.json';

const MOCK_USDC_ADDRESS = process.env.NEXT_PUBLIC_SKALE_TEST_USDC;
const MINT_AMOUNT = 100;

export const useMintUSDC = () => {
    const [loading, setLoading] = useState(false);
    const chainId = useChainId();
    const publicClient = usePublicClient();
    const { data: walletClient } = useWalletClient();
    const { address } = useAccount();
    const { writeContractAsync } = useWriteContract();
    const { switchChain, isPending: isNetworkSwitching } = useSwitchChain();

    const handleNetworkSwitch = async () => {
        try {
            await switchChain({ chainId: skaleCalypsoTestnet.id });
            return true;
        } catch (error) {
            console.error('Network switch error:', error);
            throw new Error('Failed to switch network');
        }
    };

    const mint = async () => {
        if (!address || !walletClient) {
            throw new Error('Missing required parameters');
        }

        try {
            setLoading(true);
            
            if (chainId !== skaleCalypsoTestnet.id) {
                await handleNetworkSwitch();
                return;
            }

            const amount = parseUnits("100", 6);
            const mintTxHash = await writeContractAsync({
                address: MOCK_USDC_ADDRESS,
                abi,
                functionName: 'mint',
                args: [address, amount],
            });

            const receipt = await publicClient.waitForTransactionReceipt({
                hash: mintTxHash,
            });

            return receipt;
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return {
        mint,
        loading,
        isCorrectChain: chainId === skaleCalypsoTestnet.id,
    };
};

export const useUSDCBalance = (address) => {
    const { data: balance, isLoading, refetch } = useReadContract({
        address: MOCK_USDC_ADDRESS,
        abi,
        functionName: 'balanceOf',
        args: [address],
        enabled: Boolean(address)
    });

    return {
        balance,
        isLoading,
        refetch
    };
};