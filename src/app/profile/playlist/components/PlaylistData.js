"use client"

import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import HitmakrButton from "@/app/components/buttons/HitmakrButton";
import HitmakrMiniModal from "@/app/components/modals/HitmakrMiniModal";
import styles from "../styles/Playlist.module.css";

export default function PlaylistData() {
  const { address, chainId: wagmiChainId } = useAccount();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [playlists, setPlaylists] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", description: "" });
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);

  const fetchPlaylists = async (pageNum) => {
    if (!address) return;
    
    setIsLoading(true);
    setError(null);
    const authToken = localStorage.getItem("authToken");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_HITMAKR_SERVER}/playlist/playlists?page=${pageNum}&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "x-user-address": address,
            "x-chain-id": wagmiChainId.toString(),
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch playlists");
      }

      const data = await response.json();
      
      if (pageNum === 1) {
        setPlaylists(data.playlists);
      } else {
        setPlaylists(prev => [...prev, ...data.playlists]);
      }
      
      setHasMore(data.pagination.hasNextPage);
    } catch (error) {
      console.error("Error fetching playlists:", error);
      setError(error.message);
      setModalContent({
        title: "Error",
        description: "Failed to load playlists. Please try again."
      });
      setShowModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (address) {
      fetchPlaylists(1);
    }
  }, [address]);

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      setPage(prev => prev + 1);
      fetchPlaylists(page + 1);
    }
  };

  const handleCreateNewPlaylist = () => {
    const params = new URLSearchParams(searchParams);
    params.set("option", "new");
    router.push(`/profile/playlist?${params.toString()}`);
  };

  const handlePlaylistClick = (playlist) => {
    setSelectedPlaylist(playlist);
    const params = new URLSearchParams(searchParams);
    params.set("option", "playlistid");
    params.set("playlistId", playlist.playlistId);
    router.push(`/profile/playlist?${params.toString()}`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!address) {
    return (
      <div className={styles.emptyState}>
        <p>Please connect your wallet to view playlists</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorState}>
        <p>{error}</p>
        <HitmakrButton
          buttonWidth="150px"
          buttonFunction={() => fetchPlaylists(1)}
          buttonName="Try Again"
        />
      </div>
    );
  }

  return (
    <div className={styles.playlistContainer}>
      {playlists.length === 0 && !isLoading ? (
        <div className={styles.emptyState}>
          <p>You haven't created any playlists yet!</p>
          <div className={styles.createButton}>
            <HitmakrButton
              buttonWidth="200px"
              buttonFunction={handleCreateNewPlaylist}
              buttonName="Create New Playlist"
            />
          </div>
        </div>
      ) : (
        <>
          <div className={styles.playlistGrid}>
            {playlists.map((playlist) => (
              <div 
                key={playlist.playlistId} 
                className={styles.playlistCard}
                onClick={() => handlePlaylistClick(playlist)}
              >
                <div className={styles.playlistImageContainer}>
                  <Image
                    src={playlist.imageUrl}
                    alt={playlist.name}
                    width={200}
                    height={200}
                    className={styles.playlistImage}
                    priority
                  />
                  <div className={styles.playlistOverlay}>
                    <div className={styles.playlistStats}>
                      <span>{playlist.totalTracks} tracks</span>
                      {playlist.isPublic ? (
                        <span className={styles.publicBadge}>Public</span>
                      ) : (
                        <span className={styles.privateBadge}>Private</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className={styles.playlistInfo}>
                  <h3 className={styles.playlistName}>{playlist.name}</h3>
                  <p className={styles.playlistDate}>
                    Created {formatDate(playlist.createdAt)}
                  </p>
                  {playlist.description && (
                    <p className={styles.playlistDescription}>
                      {playlist.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {isLoading && (
            <div className={styles.loadingContainer}>
              <p>Loading playlists...</p>
            </div>
          )}

          {hasMore && !isLoading && (
            <div className={styles.loadMoreContainer}>
              <HitmakrButton
                buttonWidth="150px"
                buttonFunction={handleLoadMore}
                buttonName="Load More"
                isLoading={isLoading}
              />
            </div>
          )}

          {!hasMore && playlists.length > 0 && (
            <p className={styles.endMessage}>End of playlists</p>
          )}

          <div className={styles.quickCreateButton}>
            <HitmakrButton
              buttonWidth="60px"
              buttonFunction={handleCreateNewPlaylist}
              buttonName="+"
              isRound={true}
            />
          </div>
        </>
      )}

      {showModal && (
        <HitmakrMiniModal
          title={modalContent.title}
          description={modalContent.description}
          closeButton={<i className="fi fi-br-cross-small" />}
          closeFunction={() => setShowModal(false)}
          isAction={true}
        />
      )}
    </div>
  );
}