"use client"

import React, { useMemo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import styles from "./styles/ProfileAbout.module.css";
import GetProfileDetails from "@/app/helpers/profile/GetProfileDetailsByAddress";
import { useGetDSRCNonce } from '@/app/config/hitmakrdsrcfactory/hitmakrDSRCFactoryRPC';
import { useGetUserStats } from '@/app/config/hitmakrpurchaseindexer/hitmakrPurchaseIndexerRPC';
import LoaderWhiteSmall from '@/app/components/animations/loaders/loaderWhiteSmall';

const API_BASE_URL = process.env.NEXT_PUBLIC_HITMAKR_SERVER;
const INDEXER_ADDRESS = process.env.NEXT_PUBLIC_HITMAKR_INDEXER_ADDRESS_SKL; 

const formatTokenAmount = (amount) => {
    if (!amount) return "0";
    const num = Number(amount) / 1e6; 
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(num);
};

const formatTimestamp = (timestamp) => {
    if (!timestamp || timestamp === "0") return "N/A";
    return new Date(Number(timestamp) * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

const STATS_CONFIG = [
    { id: 'releases', label: 'Releases' },
    { id: 'followers', label: 'Followers' },
    { id: 'hearts', label: 'Hearts' },
    { id: 'totalPurchases', label: 'Purchases' },
    { id: 'totalAmountSpent', label: 'Total Spent ($)', formatter: formatTokenAmount },
    { id: 'firstPurchase', label: 'First Purchase', formatter: formatTimestamp },
    { id: 'lastPurchase', label: 'Last Purchase', formatter: formatTimestamp }
];

const formatNumber = (num) => {
    if (typeof num !== 'number') return num;
    
    if (num < 1000) return num;
    
    const K = 1000;
    const M = K * 1000;
    const B = M * 1000;

    if (num >= B) {
        return `${Math.floor(num / B)}B+`;
    }
    
    if (num >= M) {
        return `${Math.floor(num / M)}M+`;
    }
    
    if (num >= K) {
        return `${Math.floor(num / K)}K+`;
    }

    return num;
};

const StatOption = React.memo(({ label, value }) => (
    <div className={styles.profileAboutRightOption}>
        <div className={styles.profileAboutRightOptionName}>
            {label}
        </div>
        <div className={styles.profileAboutRightOptionValue}>
            {value}
        </div>
    </div>
));

StatOption.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.element
    ]).isRequired
};

StatOption.displayName = 'StatOption';

const ProfileStats = ({ address }) => {
    const { nonce, isLoading: nonceLoading, error: nonceError } = useGetDSRCNonce(address);
    const { stats: userStats, loading: statsLoading } = useGetUserStats(INDEXER_ADDRESS, address);
    const [followersCount, setFollowersCount] = useState(0);
    const [heartsCount, setHeartsCount] = useState(0);
    const [isLoadingFollowers, setIsLoadingFollowers] = useState(true);
    const [isLoadingHearts, setIsLoadingHearts] = useState(true);

    useEffect(() => {
        const fetchFollowersCount = async () => {
            if (!address) return;

            try {
                const response = await fetch(
                    `${API_BASE_URL}/follow/follow-counts/${address}`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (!response.ok) {
                    throw new Error('Failed to fetch followers count');
                }

                const data = await response.json();
                setFollowersCount(data.followers);
            } catch (error) {
                console.error('Error fetching followers count:', error);
                setFollowersCount(0);
            } finally {
                setIsLoadingFollowers(false);
            }
        };

        fetchFollowersCount();
    }, [address]);

    useEffect(() => {
        const fetchHeartsCount = async () => {
            if (!address) return;

            try {
                const response = await fetch(
                    `${API_BASE_URL}/heart/user-likes-count/${address}`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    }
                );

                if (!response.ok) {
                    throw new Error('Failed to fetch hearts count');
                }

                const data = await response.json();
                setHeartsCount(data.totalLikes);
            } catch (error) {
                console.error('Error fetching hearts count:', error);
                setHeartsCount(0);
            } finally {
                setIsLoadingHearts(false);
            }
        };

        fetchHeartsCount();
    }, [address]);

    const statsData = useMemo(() => 
        STATS_CONFIG.map(config => {
            let value;
            
            if (config.id === 'releases') {
                value = nonceLoading ? "..." : nonceError ? 0 : nonce || 0;
            } else if (config.id === 'followers') {
                value = isLoadingFollowers ? "..." : followersCount;
            } else if (config.id === 'hearts') {
                value = isLoadingHearts ? "..." : heartsCount;
            } else if (statsLoading) {
                value = "...";
            } else if (!userStats) {
                value = "0";
            } else {
                switch (config.id) {
                    case 'totalPurchases':
                        value = formatNumber(Number(userStats.totalPurchases) || 0);
                        break;
                    case 'totalAmountSpent':
                        value = config.formatter(userStats.totalAmountSpent);
                        break;
                    case 'firstPurchase':
                        value = config.formatter(userStats.firstPurchaseTime);
                        break;
                    case 'lastPurchase':
                        value = config.formatter(userStats.lastPurchaseTime);
                        break;
                    default:
                        value = "0";
                }
            }
            
            return {
                ...config,
                value
            };
        }),
        [nonce, nonceLoading, nonceError, followersCount, isLoadingFollowers, 
         heartsCount, isLoadingHearts, userStats, statsLoading]
    );

    return (
        <div className={styles.profileAbout}>
            <div className={styles.profileAboutRight}>
                <div className={styles.profileAboutRightOptions}>
                    {statsData.map(({ id, label, value }) => (
                        <StatOption 
                            key={id}
                            label={label}
                            value={value}
                        />
                    ))}
                </div>
            </div>
            <div className={styles.profileAboutLeft}>
                <div className={styles.profileAboutLeftContainer}>
                    <div className={styles.profileAboutLeftContainerBasic}>
                        <GetProfileDetails 
                            address={address}
                            fallbackName="Ah, the elusive 'Anonymous user'👻 strikes again! No profile name, just vibes. They could be anyone – the next big thing in music or just a super-secret lurker. Either way, they're here to shake things up!"
                            fallbackBio="Bio? Who needs one when you're this mysterious! They're letting the silence speak for itself – or maybe they just couldn't think of anything clever. Either way, they're here on Hitmakr, keeping us all guessing!"
                        />
                    </div>
                </div>
            </div>
            
        </div>
    );
};

ProfileStats.propTypes = {
    address: PropTypes.string.isRequired
};

export default React.memo(ProfileStats);