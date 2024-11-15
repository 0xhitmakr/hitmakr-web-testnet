"use client"

import React, { useState, useEffect } from 'react';
import styles from './styles/DSRCId.module.css';
import LoaderWhiteSmall from '@/app/components/animations/loaders/loaderWhiteSmall';
import { useGetDSRC } from "@/app/config/hitmakrdsrcfactory/hitmakrDSRCFactoryRPC";
import { useGetDSRCDetails, useGetEarningsInfo } from '@/app/config/hitmakrdsrc/hitmakrDSRCRPC';

const API_BASE_URL = process.env.NEXT_PUBLIC_HITMAKR_SERVER;

const formatAmount = (amount) => {
    if (!amount) return "0.00";
    return (Number(amount) / 1e6).toFixed(2);
};

export default function DSRCAnalytics({ params }) {
    const { dsrcid } = params;
    const [socialStats, setSocialStats] = useState({
        likes: 0,
        comments: 0
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // First get the DSRC contract address
    const { dsrcAddress, isLoading: addressLoading } = useGetDSRC(dsrcid);
    
    // Then use the contract address for details and earnings
    const { details, loading: dsrcLoading } = useGetDSRCDetails(dsrcAddress);
    const { earnings, loading: earningsLoading } = useGetEarningsInfo(dsrcAddress);

    useEffect(() => {
        const fetchSocialStats = async () => {
            try {
                const likesRes = await fetch(`${API_BASE_URL}/heart/dsrc/${dsrcid}/likes`);
                const commentsRes = await fetch(`${API_BASE_URL}/comment/dsrc/${dsrcid}/comments?page=1&limit=1`);

                const [likesData, commentsData] = await Promise.all([
                    likesRes.json(),
                    commentsRes.json()
                ]);

                setSocialStats({
                    likes: likesData.likes?.length || 0,
                    comments: commentsData.pagination?.totalComments || 0
                });
            } catch (err) {
                console.error('Error fetching social stats:', err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSocialStats();
    }, [dsrcid]);

    // Combined loading state
    if (addressLoading || dsrcLoading || earningsLoading || isLoading) {
        return (
            <div className={styles.loading}>
                <LoaderWhiteSmall />
            </div>
        );
    }

    // Error handling
    if (!dsrcAddress) {
        return <div className={styles.error}>DSRC not found</div>;
    }

    if (error) {
        return <div className={styles.error}>{error}</div>;
    }

    return (
        <div className={styles.analyticsContainer}>
            <div className={styles.analyticsGrid}>
                <div className={styles.statsCard}>
                    <div className={styles.statsLabel}>Hearts</div>
                    <div className={styles.statsValue}>{socialStats.likes}</div>
                </div>

                <div className={styles.statsCard}>
                    <div className={styles.statsLabel}>Comments</div>
                    <div className={styles.statsValue}>{socialStats.comments}</div>
                </div>

                <div className={styles.statsCard}>
                    <div className={styles.statsLabel}>Price (USDC)</div>
                    <div className={styles.statsValue}>
                        {formatAmount(details?.price)}
                    </div>
                </div>

                <div className={styles.statsCard}>
                    <div className={styles.statsLabel}>Total Earnings (USDC)</div>
                    <div className={styles.statsValue}>
                        {formatAmount(earnings?.totalEarnings)}
                    </div>
                </div>

                <div className={styles.statsCard}>
                    <div className={styles.statsLabel}>Purchase Earnings (USDC)</div>
                    <div className={styles.statsValue}>
                        {formatAmount(earnings?.purchaseEarnings)}
                    </div>
                </div>

                <div className={styles.statsCard}>
                    <div className={styles.statsLabel}>Royalty Earnings (USDC)</div>
                    <div className={styles.statsValue}>
                        {formatAmount(earnings?.royaltyEarnings)}
                    </div>
                    <div className={styles.subtitle}>From secondary sales</div>
                </div>

                {details?.royaltySplits && details.royaltySplits.length > 0 && (
                    <div className={styles.royaltySplitsCard}>
                        <div className={styles.statsLabel}>Royalty Splits</div>
                        <div className={styles.splitsContainer}>
                            {details.royaltySplits.map((split, index) => (
                                <div key={index} className={styles.splitItem}>
                                    <span className={styles.splitRecipient}>
                                        {`${split.recipient.slice(0, 6)}...${split.recipient.slice(-4)}`}
                                    </span>
                                    <span className={styles.splitPercentage}>
                                        {(split.percentage/100).toFixed(0)}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}