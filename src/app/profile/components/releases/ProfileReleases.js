"use client"

import React, { useState, useEffect } from 'react';
import styles from "./styles/ProfileReleases.module.css";
import { useCreativeIDRPC } from '@/app/config/hitmakrcreativeid/hitmakrCreativeIDRPC';
import DSRCView from './components/DSRCView';
import LoaderWhiteSmall from '@/app/components/animations/loaders/loaderWhiteSmall';

const API_BASE_URL = process.env.NEXT_PUBLIC_HITMAKR_SERVER;
const ITEMS_PER_PAGE = 10;

const ProfileReleases = ({ address }) => {
    const [dsrcs, setDsrcs] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [totalDSRCs, setTotalDSRCs] = useState(0);
    const [error, setError] = useState(null);

    const { creativeIDInfo, loading: creativeIdLoading } = useCreativeIDRPC(address);

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
            fetchDSRCs(1);
        }
    }, [address, creativeIDInfo]);

    const loadMoreDSRCs = () => {
        if (!isLoading && hasMore) {
            const nextPage = currentPage + 1;
            setCurrentPage(nextPage);
            fetchDSRCs(nextPage);
        }
    };

    if (creativeIdLoading) {
        return <div className={styles.loading}><LoaderWhiteSmall /></div>;
    }

    if (!creativeIDInfo?.exists) {
        return <div className={styles.noCreativeId}>No Creative ID found for this address</div>;
    }

    if (error) {
        return <div className={styles.error}>Error: {error}</div>;
    }

    return (
        <div className={styles.profileReleases}>
            {totalDSRCs > 0 && (
                <div className={styles.totalCount}>
                    Total Releases: {totalDSRCs}
                </div>
            )}
            
            <div className={styles.dsrcGrid}>
                {dsrcs.map((dsrc) => (
                    <div key={dsrc.dsrcId} className={styles.dsrcIds}>
                        <DSRCView dsrcid={dsrc.dsrcId} />
                    </div>
                ))}
            </div>

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
                <p className={styles.noMore}>
                    No more DSRCs to load
                </p>
            )}

            {dsrcs.length === 0 && !isLoading && (
                <p className={styles.noDsrcs}>
                    No DSRCs found for this profile
                </p>
            )}
        </div>
    );
};

export default ProfileReleases;