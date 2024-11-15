"use client"

import { useState, useEffect } from 'react';
import { useGetUserPurchases, useGetUserStats } from '@/app/config/hitmakrpurchaseindexer/hitmakrPurchaseIndexerRPC';
import DSRCView from '../releases/components/DSRCView';
import LoaderWhiteSmall from '@/app/components/animations/loaders/loaderWhiteSmall';
import styles from "../releases/styles/ProfileReleases.module.css"

const ITEMS_PER_PAGE = 10;

const ProfilePurchases = ({ address, indexerAddress }) => {
  const [purchases, setPurchases] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const { stats: userStats, loading: statsLoading } = useGetUserStats(indexerAddress, address);
  
  const totalPurchases = userStats ? parseInt(userStats.totalPurchases) : 0;

  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  const limit = ITEMS_PER_PAGE;

  const {
    purchases: fetchedPurchases,
    loading: purchasesLoading,
    error,
    refetch
  } = useGetUserPurchases(
    indexerAddress,
    address,
    offset,
    limit
  );

  useEffect(() => {
    if (fetchedPurchases && fetchedPurchases.length > 0) {
      const reversedPurchases = [...fetchedPurchases].reverse();
      
      setPurchases(prevPurchases => {
        if (currentPage === 1) {
          return reversedPurchases;
        }
        return [...prevPurchases, ...reversedPurchases];
      });

      setHasMore(purchases.length + fetchedPurchases.length < totalPurchases);
    } else if (fetchedPurchases && fetchedPurchases.length === 0) {
      setHasMore(false);
    }
  }, [fetchedPurchases, currentPage, totalPurchases]);

  const loadMore = () => {
    if (!purchasesLoading && hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  };
  const isLoading = statsLoading || (purchasesLoading && purchases.length === 0);

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <LoaderWhiteSmall />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        Error loading purchases: {error.message}
      </div>
    );
  }

  if (!isLoading && purchases.length === 0) {
    return (
      <div className={styles.noDsrcs}>
        No purchases found for this profile
      </div>
    );
  }

  return (
    <div className={styles.profileReleases}>
      <div className={styles.dsrcGrid}>
        {purchases.map((purchase) => (
          <div 
            key={`${purchase.dsrcAddress}-${purchase.timestamp}`} 
            className={styles.dsrcIds}
          >
            <DSRCView 
              dsrcid={purchase.dsrcId} 
              dsrcAddress={purchase.dsrcAddress}
            />
          </div>
        ))}
      </div>

      {hasMore && (
        <div className={styles.loadMore}>
          <button
            onClick={loadMore}
            disabled={purchasesLoading}
            className={styles.loadMoreButton}
          >
            {purchasesLoading ? (
              <LoaderWhiteSmall />
            ) : (
              <i className="fi fi-sr-arrow-circle-down"></i>
            )}
          </button>
        </div>
      )}

      {!hasMore && purchases.length > 0 && (
        <p className={styles.noMore}>
          No more purchases to load
        </p>
      )}
    </div>
  );
};

export default ProfilePurchases;