"use client";

import { useState, useEffect } from "react";
import {
  useGetUserPurchases,
  useGetUserStats,
  EDITIONS
} from "@/app/config/hitmakrpurchaseindexer/hitmakrPurchaseIndexerRPC";
import DSRCView from "../releases/components/DSRCView";
import LoaderWhiteSmall from "@/app/components/animations/loaders/loaderWhiteSmall";
import styles from "../releases/styles/ProfileReleases.module.css";

const ITEMS_PER_PAGE = 10;

const EDITION_LABELS = {
  [EDITIONS.STREAMING]: "Streaming",
  [EDITIONS.COLLECTORS]: "Collectors",
  [EDITIONS.LICENSING]: "Licensing"
};

const ProfilePurchases = ({ address, indexerAddress }) => {
  const [groupedPurchases, setGroupedPurchases] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedEdition, setSelectedEdition] = useState(null);

  const { stats: userStats, loading: statsLoading } = useGetUserStats(
    indexerAddress,
    address
  );

  const totalPurchases = userStats ? parseInt(userStats.totalPurchases) : 0;

  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  const limit = ITEMS_PER_PAGE;

  const {
    purchases: fetchedPurchases,
    loading: purchasesLoading,
    error,
    refetch,
  } = useGetUserPurchases(indexerAddress, address, offset, limit);

  useEffect(() => {
    if (fetchedPurchases && fetchedPurchases.length > 0) {
      // Group purchases by dsrcId
      const groupedByDsrcId = fetchedPurchases.reduce((acc, purchase) => {
        if (!acc[purchase.dsrcId]) {
          acc[purchase.dsrcId] = {
            dsrcId: purchase.dsrcId,
            dsrcAddress: purchase.dsrcAddress,
            editions: new Set(),
            timestamp: purchase.timestamp, // Keep the earliest timestamp
          };
        }
        acc[purchase.dsrcId].editions.add(purchase.edition);
        // Update timestamp only if this purchase is newer
        if (purchase.timestamp > acc[purchase.dsrcId].timestamp) {
          acc[purchase.dsrcId].timestamp = purchase.timestamp;
        }
        return acc;
      }, {});

      const uniquePurchases = Object.values(groupedByDsrcId)
        .map(item => ({
          ...item,
          editions: Array.from(item.editions)
        }))
        .sort((a, b) => b.timestamp - a.timestamp); // Sort by most recent

      // Filter by selected edition if necessary
      const filteredPurchases = selectedEdition !== null
        ? uniquePurchases.filter(p => p.editions.includes(selectedEdition))
        : uniquePurchases;

      setGroupedPurchases((prevPurchases) => {
        if (currentPage === 1) {
          return filteredPurchases;
        }
        // Merge with previous purchases, avoiding duplicates
        const existingDsrcIds = new Set(prevPurchases.map(p => p.dsrcId));
        const newPurchases = filteredPurchases.filter(p => !existingDsrcIds.has(p.dsrcId));
        return [...prevPurchases, ...newPurchases];
      });

      // Calculate if there are more items to load
      const totalUniqueItems = Object.keys(groupedByDsrcId).length;
      setHasMore(groupedPurchases.length < totalUniqueItems);
    } else if (fetchedPurchases && fetchedPurchases.length === 0) {
      setHasMore(false);
    }
  }, [fetchedPurchases, currentPage, selectedEdition]);

  const loadMore = () => {
    if (!purchasesLoading && hasMore) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handleEditionFilter = (edition) => {
    setSelectedEdition(edition === selectedEdition ? null : edition);
    setCurrentPage(1);
    setGroupedPurchases([]);
  };

  const isLoading = statsLoading || (purchasesLoading && groupedPurchases.length === 0);

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

  if (!isLoading && groupedPurchases.length === 0) {
    return (
      <div className={styles.noDsrcs}>
        {selectedEdition !== null 
          ? `No ${EDITION_LABELS[selectedEdition]} edition purchases found`
          : "No purchases found for this profile"}
      </div>
    );
  }

  return (
    <div className={styles.profileReleases}>
      

      <div className={styles.dsrcGrid}>
        {groupedPurchases.map((purchase) => (
          <div
            key={`${purchase.dsrcAddress}-${purchase.dsrcId}`}
            className={styles.dsrcIds}
          >
            <DSRCView
              dsrcid={purchase.dsrcId}
              dsrcAddress={purchase.dsrcAddress}
              editions={purchase.editions.map(edition => EDITION_LABELS[edition])}
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

      {!hasMore && groupedPurchases.length > 0 && (
        <p className={styles.noMore}>No more purchases to load</p>
      )}
    </div>
  );
};

export default ProfilePurchases;