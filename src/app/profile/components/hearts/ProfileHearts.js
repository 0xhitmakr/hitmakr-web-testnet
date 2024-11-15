"use client"

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import DSRCView from '../releases/components/DSRCView';
import LoaderWhiteSmall from '@/app/components/animations/loaders/loaderWhiteSmall';
import styles from "../releases/styles/ProfileReleases.module.css"

const API_BASE_URL = process.env.NEXT_PUBLIC_HITMAKR_SERVER;
const ITEMS_PER_PAGE = 10;

const ProfileHearts = ({ address }) => {
  const { address: currentUserAddress, chainId } = useAccount();
  const [likedDSRCs, setLikedDSRCs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [seenDSRCIds] = useState(new Set());

  const loadMoreLikedDSRCs = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    setError(null);

    try {
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `${API_BASE_URL}/heart/user/${address}/likes?page=${currentPage}&limit=${ITEMS_PER_PAGE}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'x-user-address': currentUserAddress,
            'x-chain-id': chainId?.toString(),
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch liked DSRCs');
      }

      const data = await response.json();
      
      const newUniqueDSRCs = data.likes.filter(like => {
        if (!seenDSRCIds.has(like.dsrcId)) {
          seenDSRCIds.add(like.dsrcId);
          return true;
        }
        return false;
      });
      
      if (newUniqueDSRCs.length === 0) {
        setHasMore(false);
        return;
      }
      
      setLikedDSRCs(prev => [...prev, ...newUniqueDSRCs]);
      setCurrentPage(prev => prev + 1);
      setHasMore(data.pagination.hasNextPage);
    } catch (error) {
      console.error('Error loading liked DSRCs:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, isLoading, hasMore, address, currentUserAddress, chainId, seenDSRCIds]);

  useEffect(() => {
    setLikedDSRCs([]);
    setCurrentPage(1);
    setHasMore(true);
    seenDSRCIds.clear();
    if (address && currentUserAddress && chainId) {
      loadMoreLikedDSRCs();
    }
  }, [address, currentUserAddress, chainId]);

  if (isLoading && likedDSRCs.length === 0) {
    return (
      <div className={styles.loading}>
        <LoaderWhiteSmall />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        Error loading liked DSRCs: {error}
      </div>
    );
  }

  if (!isLoading && likedDSRCs.length === 0) {
    return (
      <div className={styles.noDsrcs}>
        No liked DSRCs found for this profile
      </div>
    );
  }

  return (
    <div className={styles.profileReleases}>
      <div className={styles.dsrcGrid}>
        {likedDSRCs.map((like) => (
          <div 
            key={like.dsrcId} 
            className={styles.dsrcIds}
          >
            <DSRCView 
              dsrcid={like.dsrcId}
              uploadHash={like.uploadHash}
            />
          </div>
        ))}
      </div>

      {hasMore && (
        <div className={styles.loadMore}>
          <button
            onClick={loadMoreLikedDSRCs}
            disabled={isLoading}
            className={styles.loadMoreButton}
          >
            {isLoading ? (
              <LoaderWhiteSmall />
            ) : (
              <i className="fi fi-sr-arrow-circle-down"></i>
            )}
          </button>
        </div>
      )}

      {!hasMore && likedDSRCs.length > 0 && (
        <p className={styles.noMore}>
          No more liked DSRCs to load
        </p>
      )}
    </div>
  );
};

export default ProfileHearts;