"use client"
import { useState } from 'react';
import { useReadContract, useWriteContract, useAccount, useChainId, usePublicClient, useWalletClient, useSwitchChain } from 'wagmi';
import { skaleCalypsoTestnet } from 'viem/chains';
import { parseUnits, formatUnits } from 'viem';
import abi from './abi/abi.json';
import usdcAbi from "../TestUSDC/abi/abi.json"


const PAYMENT_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_SKALE_TEST_USDC;
const USDC_ADDRESS = process.env.NEXT_PUBLIC_SKALE_TEST_USDC;
const USDC_DECIMALS = 6;


export const useDSRCDetails = (contractAddress) => {
    const { data: dsrcId } = useReadContract({
        address: contractAddress,
        abi,
        functionName: 'dsrcId'
    });

    const { data: tokenUri } = useReadContract({
        address: contractAddress,
        abi,
        functionName: 'tokenURI',
        args: [1]
    });

    const { data: creator } = useReadContract({
        address: contractAddress,
        abi,
        functionName: 'creator'
    });

    const { data: paymentToken } = useReadContract({
        address: contractAddress,
        abi,
        functionName: 'paymentToken'
    });

    const { data: price } = useReadContract({
        address: contractAddress,
        abi,
        functionName: 'price'
    });

    const { data: selectedChain } = useReadContract({
        address: contractAddress,
        abi,
        functionName: 'getSelectedChain'
    });

    const { data: earningsInfo } = useReadContract({
        address: contractAddress,
        abi,
        functionName: 'getEarningsInfo'
    });

    const { data: royaltySplits } = useReadContract({
        address: contractAddress,
        abi,
        functionName: 'getRoyaltySplits'
    });

    return {
        details: contractAddress ? {
            dsrcId,
            tokenUri,
            creator,
            paymentToken,
            price: price?.toString(),
            selectedChain,
            earnings: earningsInfo ? {
                purchaseEarnings: earningsInfo[0]?.toString(),
                royaltyEarnings: earningsInfo[1]?.toString(),
                pendingAmount: earningsInfo[2]?.toString(),
                totalEarnings: earningsInfo[3]?.toString()
            } : null,
            royaltySplits: royaltySplits?.map(split => ({
                recipient: split.recipient,
                percentage: Number(split.percentage)
            }))
        } : null,
        isLoading: false
    };
};


export const useHasPurchased = (contractAddress, address) => {
    const { data: purchased, isLoading, refetch } = useReadContract({
        address: contractAddress,
        abi,
        functionName: 'hasPurchased',
        args: [address],
        enabled: Boolean(contractAddress && address)
    });

    return {
        hasPurchased: purchased,
        isLoading,
        refetch
    };
};


export const usePurchaseDSRC = (contractAddress) => {
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

    const purchase = async () => {
        if (!contractAddress || !address || !walletClient) {
            throw new Error('Missing required parameters');
        }

        setLoading(true);

        try {
            if (chainId !== skaleCalypsoTestnet.id) {
                await handleNetworkSwitch();
                return;
            }

            const price = await publicClient.readContract({
                address: contractAddress,
                abi,
                functionName: 'price',
            });

            if (price > 0n) {
                const priceInUSDC = parseUnits(price.toString(), 0);
                
                const balance = await publicClient.readContract({
                    address: PAYMENT_TOKEN_ADDRESS,
                    abi: usdcAbi,
                    functionName: 'balanceOf',
                    args: [address],
                });

                if (balance < priceInUSDC) {
                    throw new Error(`Insufficient USDC balance`);
                }

                const currentAllowance = await publicClient.readContract({
                    address: PAYMENT_TOKEN_ADDRESS,
                    abi: usdcAbi,
                    functionName: 'allowance',
                    args: [address, contractAddress],
                });

                if (currentAllowance < priceInUSDC) {
                    const approveTxHash = await writeContractAsync({
                        address: PAYMENT_TOKEN_ADDRESS,
                        abi: usdcAbi,
                        functionName: 'approve',
                        args: [contractAddress, priceInUSDC],
                    });

                    await publicClient.waitForTransactionReceipt({
                        hash: approveTxHash,
                    });
                }
            }

            const purchaseTxHash = await writeContractAsync({
                address: contractAddress,
                abi,
                functionName: 'purchase',
            });

            const receipt = await publicClient.waitForTransactionReceipt({
                hash: purchaseTxHash,
            });

            return receipt;
        } catch (error) {
            console.error('Purchase error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return {
        purchase,
        loading: loading || isNetworkSwitching,
        isCorrectChain: chainId === skaleCalypsoTestnet.id,
        isNetworkSwitching,
    };
};


export const useDistributeRoyalties = (contractAddress) => {
    const [loading, setLoading] = useState(false);
    const chainId = useChainId();
    const publicClient = usePublicClient();
    const { data: walletClient } = useWalletClient();
    const { writeContractAsync } = useWriteContract();

    const distribute = async (distributeType) => {
        if (!contractAddress || !walletClient) {
            throw new Error('Missing required parameters');
        }

        if (chainId !== skaleCalypsoTestnet.id) {
            throw new Error('Please switch to Skale Calypso network');
        }

        setLoading(true);

        try {
            const [balance, earningsInfo] = await Promise.all([
                publicClient.readContract({
                    address: USDC_ADDRESS,
                    abi: usdcAbi,
                    functionName: 'balanceOf',
                    args: [contractAddress]
                }),
                publicClient.readContract({
                    address: contractAddress,
                    abi,
                    functionName: 'getEarningsInfo'
                })
            ]);

            const pendingAmount = BigInt(earningsInfo[2].toString());

            if (distributeType === 1) {
                if (balance > pendingAmount) {
                    const receiveHash = await writeContractAsync({
                        address: contractAddress,
                        abi,
                        functionName: 'onRoyaltyReceived'
                    });

                    await publicClient.waitForTransactionReceipt({
                        hash: receiveHash,
                    });

                    const updatedEarningsInfo = await publicClient.readContract({
                        address: contractAddress,
                        abi,
                        functionName: 'getEarningsInfo'
                    });

                    const updatedPendingAmount = BigInt(updatedEarningsInfo[2].toString());
                    
                    if (updatedPendingAmount === 0n) {
                        throw new Error('No earnings pending for distribution after receiving royalties');
                    }
                } else {
                    throw new Error('No new royalties available to receive and distribute');
                }
            } else if (pendingAmount === 0n) {
                throw new Error('No earnings pending for distribution');
            }

            const hash = await writeContractAsync({
                address: contractAddress,
                abi,
                functionName: 'distributeRoyalties',
                args: [distributeType],
            });

            const receipt = await publicClient.waitForTransactionReceipt({
                hash,
            });

            return receipt;

        } catch (error) {
            console.error('Distribution error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return {
        distribute,
        loading,
        isCorrectChain: chainId === skaleCalypsoTestnet.id,
    };
};

export const useUpdatePrice = (contractAddress) => {
    const [loading, setLoading] = useState(false);
    const chainId = useChainId();
    const publicClient = usePublicClient();
    const { data: walletClient } = useWalletClient();
    const { writeContractAsync } = useWriteContract();

    const updatePrice = async (newPrice) => {
        if (!contractAddress || !walletClient) {
            throw new Error('Missing required parameters');
        }

        if (chainId !== skaleCalypsoTestnet.id) {
            throw new Error('Please switch to Skale Calypso network');
        }

        setLoading(true);

        try {
            const hash = await writeContractAsync({
                address: contractAddress,
                abi,
                functionName: 'updatePrice',
                args: [newPrice],
            });

            const receipt = await publicClient.waitForTransactionReceipt({
                hash,
            });

            return receipt;
        } catch (error) {
            console.error('Price update error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return {
        updatePrice,
        loading,
        isCorrectChain: chainId === skaleCalypsoTestnet.id,
    };
};


export const useReceiveRoyalties = (contractAddress) => {
    const [loading, setLoading] = useState(false);
    const chainId = useChainId();
    const publicClient = usePublicClient();
    const { data: walletClient } = useWalletClient();
    const { writeContractAsync } = useWriteContract();

    const receiveRoyalties = async () => {
        if (!contractAddress || !walletClient) {
            throw new Error('Missing required parameters');
        }

        if (chainId !== skaleCalypsoTestnet.id) {
            throw new Error('Please switch to Skale Calypso network');
        }

        setLoading(true);

        try {
            const hash = await writeContractAsync({
                address: contractAddress,
                abi,
                functionName: 'onRoyaltyReceived'
            });

            const receipt = await publicClient.waitForTransactionReceipt({
                hash,
            });

            return receipt;
        } catch (error) {
            console.error('Royalty reception error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return {
        receiveRoyalties,
        loading,
        isCorrectChain: chainId === skaleCalypsoTestnet.id,
    };
};