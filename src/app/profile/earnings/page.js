"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useCreativeIDRPC } from '@/app/config/hitmakrcreativeid/hitmakrCreativeIDRPC';
import styles from './styles/Earnings.module.css';
import DSRCEarningsView from './components/DSRCEarningsView';
import LoaderWhiteSmall from '@/app/components/animations/loaders/loaderWhiteSmall';
import { formatUSDC } from '@/app/helpers/FormatUnits';
import RouterPushLink from '@/app/helpers/RouterPushLink';

const API_BASE_URL = process.env.NEXT_PUBLIC_HITMAKR_SERVER;
const ITEMS_PER_PAGE = 10;

const EarningsPage = () => {
    const { address } = useAccount();
    const { creativeIDInfo, loading: isLoadingCreativeId } = useCreativeIDRPC(address);
    const { routeTo } = RouterPushLink();

    // State management
    const [dsrcs, setDsrcs] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [totalDSRCs, setTotalDSRCs] = useState(0);
    const [error, setError] = useState(null);
    const [earningsMap, setEarningsMap] = useState(new Map());

    // Fetch DSRCs from the server
    const fetchDSRCs = async (page) => {
        if (!address || isLoading) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `${API_BASE_URL}/dsrc/creator/${address}?page=${page}&limit=${ITEMS_PER_PAGE}`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch DSRCs');
            }

            const data = await response.json();

            if (data.success) {
                setDsrcs(prev => page === 1 ? data.data.dsrcs : [...prev, ...data.data.dsrcs]);
                setHasMore(data.data.pagination.hasMore);
                setTotalDSRCs(data.data.pagination.total);
            } else {
                throw new Error(data.message || 'Failed to fetch DSRCs');
            }
        } catch (error) {
            console.error('Error fetching DSRCs:', error);
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        if (creativeIDInfo?.exists) {
            setCurrentPage(1);
            setDsrcs([]);
            setEarningsMap(new Map());
            fetchDSRCs(1);
        }
    }, [address, creativeIDInfo]);

    // Calculate total earnings
    const totalEarnings = useMemo(() => {
        const totals = {
            purchase: 0n,
            royalty: 0n,
            pending: 0n
        };

        for (const earnings of earningsMap.values()) {
            totals.purchase += BigInt(earnings.purchaseEarnings || 0);
            totals.royalty += BigInt(earnings.royaltyEarnings || 0);
            totals.pending += BigInt(earnings.pendingAmount || 0);
        }

        return totals;
    }, [earningsMap]);

    // Handle earnings updates
    const handleEarningsUpdate = (dsrcId, dsrcEarnings) => {
        if (!dsrcEarnings) return;

        setEarningsMap(prev => {
            const newMap = new Map(prev);
            newMap.set(dsrcId, dsrcEarnings);
            return newMap;
        });
    };

    const loadMoreDSRCs = () => {
        if (!isLoading && hasMore) {
            const nextPage = currentPage + 1;
            setCurrentPage(nextPage);
            fetchDSRCs(nextPage);
        }
    };

    // Redirect if no Creative ID
    useEffect(() => {
        if (!isLoadingCreativeId && !creativeIDInfo?.exists) {
            routeTo("/profile/onboard");
        }
    }, [creativeIDInfo, isLoadingCreativeId, routeTo]);

    if (isLoadingCreativeId) {
        return <div className={styles.loading}><LoaderWhiteSmall /></div>;
    }

    if (!creativeIDInfo?.exists) {
        return <div className={styles.noCreativeId}>No Creative ID found for this address</div>;
    }

    if (error) {
        return <div className={styles.error}>Error: {error}</div>;
    }

    return (
        <div className={styles.earnings}>
            <div className={styles.earningsHeader}>
                <div className={styles.earningsTitle}>
                    <p>Earnings</p>
                    <span>{totalDSRCs} Total DSRCs</span>
                </div>
                <div className={styles.totalEarnings}>
                    <div className={styles.earningCard}>
                        <h3>Total Purchase Earnings</h3>
                        <p>{formatUSDC(totalEarnings.purchase)} USDC</p>
                    </div>
                    <div className={styles.earningCard}>
                        <h3>Total Royalty Earnings</h3>
                        <p>{formatUSDC(totalEarnings.royalty)} USDC</p>
                    </div>
                    <div className={styles.earningCard}>
                        <h3>Total Pending</h3>
                        <p>{formatUSDC(totalEarnings.pending)} USDC</p>
                    </div>
                </div>
            </div>

            {dsrcs.map((dsrc) => (
                <div key={dsrc.dsrcId} className={styles.dsrcIds}>
                    <DSRCEarningsView 
                        dsrcid={dsrc.dsrcId}
                        onEarningsUpdate={(earnings) => handleEarningsUpdate(dsrc.dsrcId, earnings)}
                    />
                </div>
            ))}

            {hasMore && (
                <div className={styles.loadMore}>
                    <button
                        onClick={loadMoreDSRCs}
                        disabled={isLoading}
                        className={styles.loadMoreButton}
                    >
                        {isLoading ? <LoaderWhiteSmall /> : <i className="fi fi-sr-arrow-circle-down"></i>}
                    </button>
                </div>
            )}

            {!hasMore && dsrcs.length > 0 && (
                <p className={styles.noMore}>No more DSRCs to load</p>
            )}

            {dsrcs.length === 0 && !isLoading && (
                <p className={styles.noDsrcs}>No DSRCs found for this profile</p>
            )}
        </div>
    );
};

export default EarningsPage;