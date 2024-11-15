    "use client"
    import { useState, useEffect, useCallback } from 'react';
    import { ethers } from 'ethers';
    import abi from './abi/abi.json';

    const RPC_URL = process.env.NEXT_PUBLIC_SKALE_RPC_URL;

    const getContract = (contractAddress) => {
        if (!contractAddress || contractAddress === ethers.ZeroAddress) return null;
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        return new ethers.Contract(contractAddress, abi, provider);
    };

    export const useGetDSRCDetails = (contractAddress) => {
        const [details, setDetails] = useState(null);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState(null);
        const [fetchTrigger, setFetchTrigger] = useState(0);

        const refetch = useCallback(() => {
            setFetchTrigger(prev => prev + 1);
        }, []);

        useEffect(() => {
            let mounted = true;
            const contract = getContract(contractAddress);
            
            if (!contract) {
                setLoading(false);
                return;
            }

            const fetchDetails = async () => {
                try {
                    const [
                        dsrcId,
                        tokenUri,
                        creator,
                        paymentToken,
                        price,
                        selectedChain,
                        earningsInfo,
                        royaltySplits
                    ] = await Promise.all([
                        contract.dsrcId(),
                        contract.tokenURI(1),
                        contract.creator(),
                        contract.paymentToken(),
                        contract.price(),
                        contract.getSelectedChain(),
                        contract.getEarningsInfo(),
                        contract.getRoyaltySplits()
                    ]);

                    if (!mounted) return;

                    setDetails({
                        dsrcId,
                        tokenUri,
                        creator,
                        paymentToken,
                        price: price.toString(),
                        selectedChain,
                        earnings: {
                            purchaseEarnings: earningsInfo[0].toString(),
                            royaltyEarnings: earningsInfo[1].toString(),
                            pendingAmount: earningsInfo[2].toString(),
                            totalEarnings: earningsInfo[3].toString()
                        },
                        royaltySplits: royaltySplits.map(split => ({
                            recipient: split.recipient,
                            percentage: Number(split.percentage)
                        }))
                    });
                    
                    setError(null);
                } catch (err) {
                    if (!mounted) return;
                    console.error("Error fetching DSRC details:", err);
                    setError(err);
                    setDetails(null);
                } finally {
                    if (mounted) {
                        setLoading(false);
                    }
                }
            };

            fetchDetails();
            return () => {
                mounted = false;
            };
        }, [contractAddress, fetchTrigger]);

        return { details, loading, error, refetch };
    };

    export const useHasPurchased = (contractAddress, address) => {
        const [hasPurchased, setHasPurchased] = useState(false);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState(null);
        const [fetchTrigger, setFetchTrigger] = useState(0);

        const refetch = useCallback(() => {
            setFetchTrigger(prev => prev + 1);
        }, []);

        useEffect(() => {
            let mounted = true;
            const contract = getContract(contractAddress);

            if (!contract || !address) {
                setLoading(false);
                return;
            }

            const checkStatus = async () => {
                try {
                    const purchased = await contract.hasPurchased(address);
                    if (!mounted) return;
                    setHasPurchased(purchased);
                    setError(null);
                } catch (err) {
                    if (!mounted) return;
                    console.error("Error checking purchase status:", err);
                    setError(err);
                } finally {
                    if (mounted) {
                        setLoading(false);
                    }
                }
            };

            checkStatus();
            return () => {
                mounted = false;
            };
        }, [contractAddress, address, fetchTrigger]);

        return { hasPurchased, loading, error, refetch };
    };

    export const useGetEarningsInfo = (contractAddress) => {
        const [earnings, setEarnings] = useState(null);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState(null);
        const [fetchTrigger, setFetchTrigger] = useState(0);

        const refetch = useCallback(() => {
            setFetchTrigger(prev => prev + 1);
        }, []);

        useEffect(() => {
            let mounted = true;
            const contract = getContract(contractAddress);

            if (!contract) {
                setLoading(false);
                return;
            }

            const fetchEarnings = async () => {
                try {
                    const earningsInfo = await contract.getEarningsInfo();
                    if (!mounted) return;
                    setEarnings({
                        purchaseEarnings: earningsInfo[0].toString(),
                        royaltyEarnings: earningsInfo[1].toString(),
                        pendingAmount: earningsInfo[2].toString(),
                        totalEarnings: earningsInfo[3].toString()
                    });
                    setError(null);
                } catch (err) {
                    if (!mounted) return;
                    console.error("Error fetching earnings info:", err);
                    setError(err);
                    setEarnings(null);
                } finally {
                    if (mounted) {
                        setLoading(false);
                    }
                }
            };

            fetchEarnings();
            return () => {
                mounted = false;
            };
        }, [contractAddress, fetchTrigger]);

        return { earnings, loading, error, refetch };
    };

    export const useGetRoyaltySplits = (contractAddress) => {
        const [splits, setSplits] = useState(null);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState(null);
        const [fetchTrigger, setFetchTrigger] = useState(0);

        const refetch = useCallback(() => {
            setFetchTrigger(prev => prev + 1);
        }, []);

        useEffect(() => {
            let mounted = true;
            const contract = getContract(contractAddress);

            if (!contract) {
                setLoading(false);
                return;
            }

            const fetchSplits = async () => {
                try {
                    const royaltySplits = await contract.getRoyaltySplits();
                    if (!mounted) return;
                    setSplits(royaltySplits.map(split => ({
                        recipient: split.recipient,
                        percentage: Number(split.percentage)
                    })));
                    setError(null);
                } catch (err) {
                    if (!mounted) return;
                    console.error("Error fetching royalty splits:", err);
                    setError(err);
                    setSplits(null);
                } finally {
                    if (mounted) {
                        setLoading(false);
                    }
                }
            };

            fetchSplits();
            return () => {
                mounted = false;
            };
        }, [contractAddress, fetchTrigger]);

        return { splits, loading, error, refetch };
    };

    export const useGetPrice = (contractAddress) => {
        const [price, setPrice] = useState(null);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState(null);
        const [fetchTrigger, setFetchTrigger] = useState(0);

        const refetch = useCallback(() => {
            setFetchTrigger(prev => prev + 1);
        }, []);

        useEffect(() => {
            let mounted = true;
            const contract = getContract(contractAddress);

            if (!contract) {
                setLoading(false);
                return;
            }

            const fetchPrice = async () => {
                try {
                    const dsrcPrice = await contract.price();
                    if (!mounted) return;
                    setPrice(dsrcPrice.toString());
                    setError(null);
                } catch (err) {
                    if (!mounted) return;
                    console.error("Error fetching price:", err);
                    setError(err);
                    setPrice(null);
                } finally {
                    if (mounted) {
                        setLoading(false);
                    }
                }
            };

            fetchPrice();
            return () => {
                mounted = false;
            };
        }, [contractAddress, fetchTrigger]);

        return { price, loading, error, refetch };
    };