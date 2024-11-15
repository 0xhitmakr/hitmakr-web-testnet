"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import GetDpByAddress from "@/app/helpers/profile/GetDpByAddress";
import GetUsernameByAddress from "@/app/helpers/profile/GetUsernameByAddress";
import UserFollow from "@/app/helpers/profile/UserFollow";
import LoaderWhiteSmall from '@/app/components/animations/loaders/loaderWhiteSmall';
import styles from "./styles/ProfileFans.module.css";
import { useAccount } from 'wagmi';

const API_BASE_URL = process.env.NEXT_PUBLIC_HITMAKR_SERVER;
const ITEMS_PER_PAGE = 10;

export default function ProfileFans({ address }) {
  const router = useRouter();
  const [followers, setFollowers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [seenAddresses] = useState(new Set());
  const {address:accountAddress,chainId} = useAccount();


  const loadMoreFollowers = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    setError(null);

    try {
        const authToken = localStorage.getItem("authToken");
        if (!authToken) return;
      const response = await fetch(
        `${API_BASE_URL}/follow/followers/${address}?page=${currentPage}&limit=${ITEMS_PER_PAGE}`,
        {
          method: 'GET',
          headers: {
                'Authorization': `Bearer ${authToken}`,
                'x-user-address': accountAddress,
                'x-chain-id': chainId?.toString(),
                'Content-Type': 'application/json'
            }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch followers');
      }

      const data = await response.json();
      
      // Filter out duplicates using the Set
      const newUniqueFollowers = data.followers.filter(follower => {
        const lowercaseAddress = follower.toLowerCase();
        if (!seenAddresses.has(lowercaseAddress)) {
          seenAddresses.add(lowercaseAddress);
          return true;
        }
        return false;
      });
      
      if (newUniqueFollowers.length === 0) {
        setHasMore(false);
        return;
      }
      
      setFollowers(prev => [...prev, ...newUniqueFollowers]);
      setCurrentPage(prev => prev + 1);
      setHasMore(data.pagination.hasNextPage);
    } catch (error) {
      console.error('Error loading followers:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, isLoading, hasMore, address, seenAddresses]);

  useEffect(() => {
    setFollowers([]);
    setCurrentPage(1);
    setHasMore(true);
    seenAddresses.clear();
    if (address) {
      loadMoreFollowers();
    }
  }, [address]);

  const handleFanClick = (fanAddress) => {
    router.push(`/profile?address=${fanAddress}&view=about`);
  };

  if (error) {
    return <div className={styles.noFans}>Error loading fans: {error}</div>;
  }

  return (
    <div className={styles.profileFans}>
      <div className={styles.fansGrid}>
        {followers.map((followerAddress) => (
          <div key={followerAddress} className={styles.fanCard}>
            <div 
              className={styles.leftSection}
              onClick={() => handleFanClick(followerAddress)}
            >
              <div className={styles.imageContainer}>
                <GetDpByAddress
                  address={followerAddress}
                  width={50}
                  height={50}
                />
              </div>
              <div className={styles.userInfo}>
                <div className={styles.userName}>
                  <GetUsernameByAddress address={followerAddress} />
                </div>
                <div className={styles.userAddress}>
                  {`${followerAddress.slice(0, 6)}...${followerAddress.slice(-4)}`}
                </div>
              </div>
            </div>
            <div className={styles.followButtonContainer}>
              <UserFollow userAddress={followerAddress} />
            </div>
          </div>
        ))}
      </div>

      {followers.length === 0 && !isLoading ? (
        <div className={styles.noFans}>
          No fans yet
        </div>
      ) : hasMore && (
        <div className={styles.loadMore}>
          <button
            onClick={loadMoreFollowers}
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

      {!hasMore && followers.length > 0 && (
        <p className={styles.noMore}>
          No more fans to load
        </p>
      )}
    </div>
  );
}