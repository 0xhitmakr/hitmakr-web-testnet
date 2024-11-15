"use client"
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

import abi from './abi/abi.json';

const RPC_URL = process.env.NEXT_PUBLIC_SKALE_RPC_URL;

export const useGetUserStats = (indexerAddress, userAddress) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            if (!indexerAddress || !userAddress) {
                setLoading(false);
                return;
            }

            try {
                const provider = new ethers.JsonRpcProvider(RPC_URL);
                const contract = new ethers.Contract(
                    indexerAddress,
                    abi,
                    provider
                );

                const userStats = await contract.getUserStats(userAddress);
                setStats({
                    totalPurchases: userStats.totalPurchases.toString(),
                    totalAmountSpent: userStats.totalAmountSpent.toString(),
                    firstPurchaseTime: userStats.firstPurchaseTime.toString(),
                    lastPurchaseTime: userStats.lastPurchaseTime.toString()
                });
                setError(null);
            } catch (err) {
                console.error("Error fetching user stats:", err);
                setError(err);
                setStats(null);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [indexerAddress, userAddress]);

    return { stats, loading, error };
};

export const useGetUserPurchases = (indexerAddress, userAddress, offset = 0, limit = 10) => {
    const [purchases, setPurchases] = useState([]);
    const [total, setTotal] = useState(0);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchPurchases = async () => {
        if (!indexerAddress || !userAddress) {
            setLoading(false);
            return;
        }

        try {
            const provider = new ethers.JsonRpcProvider(RPC_URL);
            const contract = new ethers.Contract(
                indexerAddress,
                abi,
                provider
            );

            const [purchaseData, totalPurchases, userStats] = await contract.getUserPurchases(
                userAddress,
                offset,
                limit
            );

            setPurchases(purchaseData.map(purchase => ({
                dsrcAddress: purchase.dsrcAddress,
                dsrcId: purchase.dsrcId,
                timestamp: purchase.timestamp.toString(),
                price: purchase.price.toString()
            })));
            setTotal(totalPurchases.toString());
            setStats({
                totalPurchases: userStats.totalPurchases.toString(),
                totalAmountSpent: userStats.totalAmountSpent.toString(),
                firstPurchaseTime: userStats.firstPurchaseTime.toString(),
                lastPurchaseTime: userStats.lastPurchaseTime.toString()
            });
            setError(null);
        } catch (err) {
            console.error("Error fetching user purchases:", err);
            setError(err);
            setPurchases([]);
            setTotal(0);
            setStats(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPurchases();
    }, [indexerAddress, userAddress, offset, limit]);

    return {
        purchases,
        total,
        stats,
        loading,
        error,
        refetch: fetchPurchases
    };
};


export const useCheckUserPurchase = (indexerAddress, userAddress, dsrcAddress) => {
    const [hasPurchased, setHasPurchased] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const checkPurchase = async () => {
        if (!indexerAddress || !userAddress || !dsrcAddress) {
            setLoading(false);
            return;
        }

        try {
            const provider = new ethers.JsonRpcProvider(RPC_URL);
            const contract = new ethers.Contract(
                indexerAddress,
                abi,
                provider
            );

            const purchased = await contract.checkUserPurchase(userAddress, dsrcAddress);
            setHasPurchased(purchased);
            setError(null);
        } catch (err) {
            console.error("Error checking user purchase:", err);
            setError(err);
            setHasPurchased(false);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkPurchase();
    }, [indexerAddress, userAddress, dsrcAddress]);

    return {
        hasPurchased,
        loading,
        error,
        refetch: checkPurchase
    };
};


export const useIsValidDSRC = (indexerAddress, dsrcAddress) => {
    const [isValid, setIsValid] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const checkValidity = async () => {
            if (!indexerAddress || !dsrcAddress) {
                setLoading(false);
                return;
            }

            try {
                const provider = new ethers.JsonRpcProvider(RPC_URL);
                const contract = new ethers.Contract(
                    indexerAddress,
                    abi,
                    provider
                );

                const valid = await contract.isValidDSRC(dsrcAddress);
                setIsValid(valid);
                setError(null);
            } catch (err) {
                console.error("Error checking DSRC validity:", err);
                setError(err);
                setIsValid(false);
            } finally {
                setLoading(false);
            }
        };

        checkValidity();
    }, [indexerAddress, dsrcAddress]);

    return { isValid, loading, error };
};


export const useGetGlobalStats = (indexerAddress) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchStats = async () => {
        if (!indexerAddress) {
            setLoading(false);
            return;
        }

        try {
            const provider = new ethers.JsonRpcProvider(RPC_URL);
            const contract = new ethers.Contract(
                indexerAddress,
                abi,
                provider
            );

            const [totalPurchases, totalActiveBuyers] = await contract.getGlobalStats();
            setStats({
                totalPurchases: totalPurchases.toString(),
                totalActiveBuyers: totalActiveBuyers.toString()
            });
            setError(null);
        } catch (err) {
            console.error("Error fetching global stats:", err);
            setError(err);
            setStats(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [indexerAddress]);

    return {
        stats,
        loading,
        error,
        refetch: fetchStats
    };
};


export const useIsUserActiveBuyer = (indexerAddress, userAddress) => {
    const [isActiveBuyer, setIsActiveBuyer] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const checkActiveBuyer = async () => {
            if (!indexerAddress || !userAddress) {
                setLoading(false);
                return;
            }

            try {
                const provider = new ethers.JsonRpcProvider(RPC_URL);
                const contract = new ethers.Contract(
                    indexerAddress,
                    abi,
                    provider
                );

                const isActive = await contract.isUserActiveBuyer(userAddress);
                setIsActiveBuyer(isActive);
                setError(null);
            } catch (err) {
                console.error("Error checking active buyer status:", err);
                setError(err);
                setIsActiveBuyer(false);
            } finally {
                setLoading(false);
            }
        };

        checkActiveBuyer();
    }, [indexerAddress, userAddress]);

    return { isActiveBuyer, loading, error };
};