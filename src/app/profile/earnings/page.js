"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useGetCurrentYearCount, useGetYearCount } from '@/app/config/hitmakrdsrcfactory/hitmakrDSRCFactoryRPC';
import { useCreativeIDRPC } from '@/app/config/hitmakrcreativeid/hitmakrCreativeIDRPC';
import styles from './styles/Earnings.module.css';
import DSRCEarningsView from './components/DSRCEarningsView';
import LoaderWhiteSmall from '@/app/components/animations/loaders/loaderWhiteSmall';
import { formatUnits } from '@/app/helpers/FormatUnits';
import RouterPushLink from '@/app/helpers/RouterPushLink';

const DEPLOYMENT_YEAR = 24;
const ITEMS_PER_PAGE = 10;

const EarningsPage = () => {
    const { address } = useAccount();
    const { yearCount: currentYearData, isLoading: isLoadingYearCount } = useGetCurrentYearCount(address);
    const { creativeIDInfo, loading: isLoadingCreativeId } = useCreativeIDRPC(address);
    const { routeTo } = RouterPushLink();

    const [dsrcs, setDsrcs] = useState([]);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [earningsMap, setEarningsMap] = useState(new Map());

    // Calculate year range
    const yearRange = useMemo(() => {
        if (!currentYearData?.year || !creativeIDInfo?.exists) return [];
        const years = [];
        for (let year = currentYearData.year; year >= DEPLOYMENT_YEAR; year--) {
            years.push(year);
        }
        return years;
    }, [currentYearData?.year, creativeIDInfo?.exists]);

    const year0Count = useGetYearCount(address, yearRange[0] || 0);
    const year1Count = useGetYearCount(address, yearRange[1] || 0);
    const year2Count = useGetYearCount(address, yearRange[2] || 0);
    const year3Count = useGetYearCount(address, yearRange[3] || 0);
    const year4Count = useGetYearCount(address, yearRange[4] || 0);


    const yearCounts = useMemo(() => [
        year0Count,
        year1Count,
        year2Count,
        year3Count,
        year4Count
    ], [year0Count, year1Count, year2Count, year3Count, year4Count]);

    const years = useMemo(() => {
        if (!currentYearData?.year || !creativeIDInfo?.exists) return [];
        
        const yearData = [];
        
        if (currentYearData.count > 0) {
            yearData.push({
                year: currentYearData.year,
                count: currentYearData.count,
                startIndex: currentYearData.count,
                endIndex: 1
            });
        }
        
        yearRange.slice(1).forEach((year, index) => {
            const { count } = yearCounts[index + 1] || { count: 0 };
            if (count > 0) {
                yearData.push({
                    year,
                    count,
                    startIndex: count,
                    endIndex: 1
                });
            }
        });
        
        return yearData;
    }, [currentYearData, yearCounts, yearRange, creativeIDInfo?.exists]);

    useEffect(() => {
        if (!isLoadingCreativeId && !creativeIDInfo?.exists) {
            routeTo("/profile/onboard");
        }
    }, [creativeIDInfo, isLoadingCreativeId, routeTo]);

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

    const totalDSRCs = useMemo(() => {
        return years.reduce((sum, year) => sum + year.count, 0);
    }, [years]);

    const loadMoreDSRCs = async () => {
        if (isLoading || !creativeIDInfo?.id || years.length === 0) return;
        
        setIsLoading(true);
        
        const startIndex = (page - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        
        let dsrcIds = [];
        let countSoFar = 0;

        for (const yearInfo of years) {
            if (countSoFar >= endIndex) break;
            
            const yearStartCount = countSoFar;
            const yearEndCount = countSoFar + yearInfo.count;

            if (yearStartCount < endIndex && yearEndCount > startIndex) {
                const skipItems = Math.max(0, startIndex - yearStartCount);
                const takeItems = Math.min(
                    yearInfo.count - skipItems,
                    endIndex - Math.max(startIndex, yearStartCount)
                );

                const start = yearInfo.startIndex - skipItems;
                const end = Math.max(start - takeItems + 1, 1);

                for (let i = start; i >= end; i--) {
                    const dsrcId = `${creativeIDInfo.id}${yearInfo.year.toString().padStart(2, '0')}${i.toString().padStart(5, '0')}`;
                    dsrcIds.push({
                        id: dsrcId,
                        year: yearInfo.year,
                        index: i
                    });
                }
            }
            countSoFar += yearInfo.count;
        }

        setDsrcs(prev => [...prev, ...dsrcIds]);
        setPage(p => p + 1);
        setIsLoading(false);
    };

    const handleEarningsUpdate = (dsrcId, dsrcEarnings) => {
        if (!dsrcEarnings) return;

        setEarningsMap(prev => {
            const newMap = new Map(prev);
            newMap.set(dsrcId, dsrcEarnings);
            return newMap;
        });
    };

    useEffect(() => {
        setDsrcs([]);
        setPage(1);
        setEarningsMap(new Map());
    }, [address, creativeIDInfo?.id]);

    useEffect(() => {
        if (years.length > 0 && dsrcs.length === 0) {
            loadMoreDSRCs();
        }
    }, [years.length, dsrcs.length]);

    if (isLoadingCreativeId || isLoadingYearCount || yearCounts.some(yc => yc?.isLoading)) {
        return <div className={styles.loading}><LoaderWhiteSmall /></div>;
    }

    if (!creativeIDInfo?.exists) {
        return <div className={styles.noCreativeId}>No Creative ID found for this address</div>;
    }

    const hasMore = dsrcs.length < totalDSRCs;

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
                        <p>{formatUnits(totalEarnings.purchase, 6)} USDC</p>
                    </div>
                    <div className={styles.earningCard}>
                        <h3>Total Royalty Earnings</h3>
                        <p>{formatUnits(totalEarnings.royalty, 6)} USDC</p>
                    </div>
                    <div className={styles.earningCard}>
                        <h3>Total Pending</h3>
                        <p>{formatUnits(totalEarnings.pending, 6)} USDC</p>
                    </div>
                </div>
            </div>

            {dsrcs.map((dsrc) => (
                <div key={dsrc.id} className={styles.dsrcIds}>
                    <DSRCEarningsView 
                        dsrcid={dsrc.id}
                        onEarningsUpdate={(earnings) => handleEarningsUpdate(dsrc.id, earnings)}
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