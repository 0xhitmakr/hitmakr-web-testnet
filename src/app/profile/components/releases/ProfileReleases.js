"use client"

import React, { useState, useEffect } from 'react';
import { useGetYearCount, useGetCurrentYearCount } from '@/app/config/hitmakrdsrcfactory/hitmakrDSRCFactoryRPC';
import styles from "./styles/ProfileReleases.module.css";
import { useCreativeIDRPC } from '@/app/config/hitmakrcreativeid/hitmakrCreativeIDRPC';
import DSRCView from './components/DSRCView';
import LoaderWhiteSmall from '@/app/components/animations/loaders/loaderWhiteSmall';

const DEPLOYMENT_YEAR = 24;
const ITEMS_PER_PAGE = 10;

const ProfileReleases = ({ address }) => {
  const [dsrcs, setDsrcs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [yearData, setYearData] = useState([]);
  const [totalDSRCs, setTotalDSRCs] = useState(0);

  const { yearCount: currentYearData, isLoading: isLoadingYearCount } = useGetCurrentYearCount(address);
  const { creativeIDInfo, loading: isLoadingCreativeId } = useCreativeIDRPC(address);

  useEffect(() => {
    const fetchYearCounts = async () => {
      if (!currentYearData?.year || !creativeIDInfo?.exists) return;

      const years = [];
      let currentYear = currentYearData.year;
      
      if (currentYearData.count > 0) {
        years.push({
          year: currentYear,
          count: currentYearData.count,
          startIndex: currentYearData.count,
          endIndex: 1
        });
      }

      while (currentYear > DEPLOYMENT_YEAR) {
        const prevYear = currentYear - 1;
        const { count, isLoading: yearLoading } = useGetYearCount(address, prevYear);
        
        if (!yearLoading && count > 0) {
          years.push({
            year: prevYear,
            count: count,
            startIndex: count,
            endIndex: 1
          });
        }
        
        if (prevYear === DEPLOYMENT_YEAR) break;
        currentYear--;
      }

      const total = years.reduce((sum, year) => sum + year.count, 0);
      setTotalDSRCs(total);
      setYearData(years);
    };

    fetchYearCounts();
  }, [currentYearData, address, creativeIDInfo]);
  
  const loadMoreDSRCs = () => {
    if (isLoading || !creativeIDInfo?.id) return;
    setIsLoading(true);

    try {
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      let countSoFar = 0;
      let newDsrcs = [];

      for (const yearInfo of yearData) {
        const yearStartCount = countSoFar;
        const yearEndCount = countSoFar + yearInfo.count;

        if (yearStartCount < endIndex && yearEndCount > startIndex) {
          const itemsToSkip = Math.max(0, startIndex - yearStartCount);
          const itemsToTake = Math.min(
            yearInfo.count - itemsToSkip,
            endIndex - Math.max(startIndex, yearStartCount)
          );

          const yearStart = yearInfo.startIndex - itemsToSkip;
          const yearEnd = Math.max(yearStart - itemsToTake + 1, 1);

          for (let i = yearStart; i >= yearEnd; i--) {
            const dsrcId = `${creativeIDInfo.id}${yearInfo.year.toString().padStart(2, '0')}${i.toString().padStart(5, '0')}`;
            newDsrcs.push({
              id: dsrcId,
              year: yearInfo.year,
              index: i
            });
          }
        }
        countSoFar += yearInfo.count;
      }

      setDsrcs(prev => [...prev, ...newDsrcs]);
      setCurrentPage(prev => prev + 1);
      setHasMore(countSoFar > endIndex);
      
    } catch (error) {
      console.error('Error loading DSRCs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (yearData.length > 0 && dsrcs.length === 0 && creativeIDInfo?.id) {
      loadMoreDSRCs();
    }
  }, [yearData, creativeIDInfo]);

  if (isLoadingCreativeId || isLoadingYearCount) {
    return <div className={styles.loading}><LoaderWhiteSmall /></div>;
  }

  if (!creativeIDInfo?.exists) {
    return <div className={styles.noCreativeId}>No Creative ID found for this address</div>;
  }

  return (
    <div className={styles.profileReleases}>
      <div className={styles.dsrcGrid}>
        {dsrcs.map((dsrc) => (
          <div key={dsrc.id} className={styles.dsrcIds}>
            <DSRCView dsrcid={dsrc.id}/>
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