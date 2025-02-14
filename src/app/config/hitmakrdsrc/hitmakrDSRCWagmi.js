"use client"
import { useState } from 'react';
import { useReadContract, useWriteContract, useAccount, useChainId, usePublicClient, useWalletClient, useSwitchChain } from 'wagmi';
import { skaleCalypsoTestnet } from 'viem/chains';
import { parseUnits } from 'viem';
import abi from './abi/abi.json';
import usdcAbi from "../TestUSDC/abi/abi.json"
import { useQuery } from '@tanstack/react-query';


const PAYMENT_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_SKALE_TEST_USDC;
const USDC_ADDRESS = process.env.NEXT_PUBLIC_SKALE_TEST_USDC;
const USDC_DECIMALS = 6;

// Edition enum to match contract
const Edition = {
    Streaming: 0,
    Collectors: 1,
    Licensing: 2
};

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

    const { data: selectedChain } = useReadContract({
        address: contractAddress,
        abi,
        functionName: 'selectedChain'
    });

    const { data: earningsInfo } = useReadContract({
        address: contractAddress,
        abi,
        functionName: 'getEarningsInfo'
    });

    const { data: streamingConfig } = useReadContract({
        address: contractAddress,
        abi,
        functionName: 'getEditionConfig',
        args: [Edition.Streaming]
    });

    const { data: collectorsConfig } = useReadContract({
        address: contractAddress,
        abi,
        functionName: 'getEditionConfig',
        args: [Edition.Collectors]
    });

    const { data: licensingConfig } = useReadContract({
        address: contractAddress,
        abi,
        functionName: 'getEditionConfig',
        args: [Edition.Licensing]
    });

    const { data: totalSupply } = useReadContract({
        address: contractAddress,
        abi,
        functionName: 'totalSupply_'
    });

    return {
        details: contractAddress ? {
            dsrcId,
            tokenUri,
            creator,
            paymentToken,
            selectedChain,
            totalSupply: totalSupply?.toString(),
            editions: {
                streaming: streamingConfig ? {
                    price: streamingConfig[0]?.toString(),
                    isEnabled: streamingConfig[1],
                    isCreated: streamingConfig[2]
                } : null,
                collectors: collectorsConfig ? {
                    price: collectorsConfig[0]?.toString(),
                    isEnabled: collectorsConfig[1],
                    isCreated: collectorsConfig[2]
                } : null,
                licensing: licensingConfig ? {
                    price: licensingConfig[0]?.toString(),
                    isEnabled: licensingConfig[1],
                    isCreated: licensingConfig[2]
                } : null
            },
            earnings: earningsInfo ? {
                purchaseEarnings: earningsInfo[0]?.toString(),
                royaltyEarnings: earningsInfo[1]?.toString(),
                pendingAmount: earningsInfo[2]?.toString(),
                totalEarnings: earningsInfo[3]?.toString()
            } : null
        } : null,
        isLoading: false
    };
};

export const useHasPurchased = (contractAddress, address) => {
    const checkStatus = async () => {
      if (!address) return {
        streaming: false,
        collectors: false,
        licensing: false
      };
      const contract = getContract(contractAddress);
      const [streaming, collectors, licensing] = await Promise.all([
        contract.editionPurchased(address, Edition.Streaming),
        contract.editionPurchased(address, Edition.Collectors),
        contract.editionPurchased(address, Edition.Licensing),
      ]);
      return {
        streaming,
        collectors,
        licensing
      };
    };

    const editionsPurchasedQuery = useQuery({
        queryKey: ["purchasedEditions", contractAddress, address],
        queryFn: checkStatus,
        enabled: !!contractAddress && !!address,
    });

    return {
        hasPurchased: editionsPurchasedQuery.data,
        isLoading: editionsPurchasedQuery.isLoading,
        refetch: editionsPurchasedQuery.refetch
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

    const purchase = async (edition) => {
        if (!contractAddress || !address || !walletClient) {
            throw new Error('Missing required parameters');
        }

        setLoading(true);

        try {
            if (chainId !== skaleCalypsoTestnet.id) {
                await handleNetworkSwitch();
                return;
            }

            const editionConfig = await publicClient.readContract({
                address: contractAddress,
                abi,
                functionName: 'getEditionConfig',
                args: [edition]
            });

            const price = editionConfig[0];

            if (price > 0n) {
                const balance = await publicClient.readContract({
                    address: PAYMENT_TOKEN_ADDRESS,
                    abi: usdcAbi,
                    functionName: 'balanceOf',
                    args: [address],
                });

                if (balance < price) {
                    window.open('https://testnet.portal.skale.space/bridge?from=mainnet&to=giant-half-dual-testnet&token=usdc&type=erc20', '_blank');
                    throw new Error('Insufficient USDC balance. A new window has been opened to bridge USDC to SKALE Network');
                }

                const currentAllowance = await publicClient.readContract({
                    address: PAYMENT_TOKEN_ADDRESS,
                    abi: usdcAbi,
                    functionName: 'allowance',
                    args: [address, contractAddress],
                });

                if (currentAllowance < price) {
                    const approveTxHash = await writeContractAsync({
                        address: PAYMENT_TOKEN_ADDRESS,
                        abi: usdcAbi,
                        functionName: 'approve',
                        args: [contractAddress, price],
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
                args: [edition],
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

            if (distributeType === 1) { // Distribute and Receive
                if (balance > pendingAmount) {
                    const receiveHash = await writeContractAsync({
                        address: contractAddress,
                        abi,
                        functionName: 'onRoyaltyReceived'
                    });

                    await publicClient.waitForTransactionReceipt({
                        hash: receiveHash,
                    });
                } else {
                   console.log("No new royalties available to receive, distributing purchase earnings only.");
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

export const useUpdateEditionPrice = (contractAddress) => {
    const [loading, setLoading] = useState(false);
    const chainId = useChainId();
    const publicClient = usePublicClient();
    const { data: walletClient } = useWalletClient();
    const { writeContractAsync } = useWriteContract();

    const updatePrice = async (edition, newPrice) => {
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
                functionName: 'updateEditionPrice',
                args: [edition, newPrice],
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

export const useUpdateEditionStatus = (contractAddress) => {
    const [loading, setLoading] = useState(false);
    const chainId = useChainId();
    const publicClient = usePublicClient();
    const { data: walletClient } = useWalletClient();
    const { writeContractAsync } = useWriteContract();

    const updateStatus = async (edition, isEnabled) => {
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
                functionName: 'updateEditionStatus',
                args: [edition, isEnabled],
            });

            const receipt = await publicClient.waitForTransactionReceipt({
                hash,
            });

            return receipt;
        } catch (error) {
            console.error('Status update error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return {
        updateStatus,
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

export { Edition };