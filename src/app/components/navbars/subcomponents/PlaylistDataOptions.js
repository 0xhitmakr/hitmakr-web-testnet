"use client"

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import Image from "next/image";
import LoaderWhiteSmall from "../../animations/loaders/loaderWhiteSmall";
import styles from "../styles/PlaylistDataOptions.module.css";
import { useRecoilState } from "recoil";
import LayoutStore from "@/app/config/store/LayoutStore";

export default function PlaylistDataOptions() {
  const { address, chainId: wagmiChainId } = useAccount();
  const router = useRouter();
  const observer = useRef();
  const loadingRef = useRef();
  const searchDebounceRef = useRef(null);
  const [layoutMetadata, setLayoutMetadata] = useRecoilState(LayoutStore.LayoutMetadata);
  const [playlists, setPlaylists] = useState([]);
  const [originalPlaylists, setOriginalPlaylists] = useState([]);
  const [sortBy, setSortBy] = useState('Recents');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  const fetchPlaylists = async (pageNumber) => {
    if (!address || loading || (!hasMore && pageNumber > 1)) return;
    
    setLoading(true);
    const authToken = localStorage.getItem("authToken");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_HITMAKR_SERVER}/playlist/playlists?page=${pageNumber}&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "x-user-address": address,
            "x-chain-id": wagmiChainId.toString(),
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch playlists");

      const data = await response.json();
      
      let newPlaylists;
      if (pageNumber === 1) {
        newPlaylists = data.playlists;
        setOriginalPlaylists(data.playlists);
      } else {
        newPlaylists = [...originalPlaylists, ...data.playlists];
        setOriginalPlaylists(newPlaylists);
      }
      
      if (searchQuery) {
        filterPlaylists(searchQuery, newPlaylists);
      } else {
        setPlaylists(newPlaylists);
      }
      
      setHasMore(data.pagination.hasNextPage);
      setError(null);
    } catch (error) {
      console.error("Error fetching playlists:", error);
      setError("Failed to load playlists");
    } finally {
      setLoading(false);
    }
  };

  const lastPlaylistRef = useCallback(node => {
    if (loading) return;
    
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  useEffect(() => {
    fetchPlaylists(page);
  }, [address, page]);

  const filterPlaylists = (query, playlistsToFilter = originalPlaylists) => {
    if (!query.trim()) {
      setPlaylists(playlistsToFilter);
      return;
    }

    const searchTerm = query.toLowerCase().trim();
    const filtered = playlistsToFilter.filter(playlist => {
      const nameMatch = playlist.name.toLowerCase().includes(searchTerm);
      const playlistIdMatch = playlist.playlistId.toLowerCase().includes(searchTerm);
      const dsrcMatch = playlist.tracks?.some(track => 
        track.dsrcId.toLowerCase().includes(searchTerm)
      );
      const descriptionMatch = playlist.description?.toLowerCase().includes(searchTerm);

      return nameMatch || playlistIdMatch || dsrcMatch || descriptionMatch;
    });

    setPlaylists(filtered);
  };

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      filterPlaylists(query);
    }, 300);
  };

  const handlePlaylistClick = (playlist) => {
    router.push(`/playlist/${playlist.playlistId}`);
    setLayoutMetadata({ 
        ...layoutMetadata, 
        isLibraryBarActive: false 
    })
  };

  const handleSortChange = (option) => {
    setSortBy(option);
    setShowSortMenu(false);
    
    const sortedPlaylists = [...playlists];
    switch(option) {
      case 'Recents':
        sortedPlaylists.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'A-Z':
        sortedPlaylists.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
    setPlaylists(sortedPlaylists);
  };

  return (
    <div className={styles.libraryContainer}>
      <div className={styles.controlsContainer}>
        <div className={styles.searchAndSort}>
          <div className={`${styles.searchBar} ${isSearchExpanded ? styles.expanded : ''}`}>
            <button 
              className={styles.searchButton}
              onClick={() => {
                setIsSearchExpanded(!isSearchExpanded);
                if (!isSearchExpanded) {
                  setSearchQuery("");
                  setPlaylists(originalPlaylists);
                }
              }}
            >
              <i className="fi fi-rr-search"></i>
            </button>
            {isSearchExpanded && (
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Search"
                className={styles.searchInput}
                autoFocus
              />
            )}
          </div>
          
          <div className={styles.sortDropdown}>
            <button 
              className={styles.sortButton} 
              onClick={() => setShowSortMenu(!showSortMenu)}
            >
              <i className="fi fi-rr-sort"></i>
              <span>Sort</span>
            </button>
            {showSortMenu && (
              <div className={styles.sortMenu}>
                <button 
                  className={sortBy === 'Recents' ? styles.active : ''} 
                  onClick={() => handleSortChange('Recents')}
                >
                  Recents
                </button>
                <button 
                  className={sortBy === 'A-Z' ? styles.active : ''} 
                  onClick={() => handleSortChange('A-Z')}
                >
                  A-Z
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.playlistsContainer}>
        {playlists.length === 0 ? (
          <div className={styles.emptyState}>
            {searchQuery ? (
              <p>No playlists match your search</p>
            ) : (
              <p>No personal playlists</p>
            )}
          </div>
        ) : (
          <div className={styles.playlistsList}>
            {playlists.map((playlist, index) => (
              <div
                key={playlist.playlistId}
                ref={index === playlists.length - 1 ? lastPlaylistRef : null}
                className={styles.playlistItem}
                onClick={() => handlePlaylistClick(playlist)}
              >
                <div className={styles.playlistImageContainer}>
                  <Image
                    src={playlist.imageUrl}
                    alt={playlist.name}
                    width={48}
                    height={48}
                    className={styles.playlistImage}
                  />
                </div>
                <div className={styles.playlistInfo}>
                  <h4 className={styles.playlistName}>{playlist.name}</h4>
                  <p className={styles.playlistMeta}>
                    Playlist • {playlist.totalTracks} {playlist.totalTracks === 1 ? 'DSRC' : 'DSRCs'}
                  </p>
                </div>
              </div>
            ))}
            <div ref={loadingRef} className={styles.loadingState}>
              {loading && <LoaderWhiteSmall />}
              {!hasMore && playlists.length > 0 && (
                <p className={styles.endMessage}>No more playlists</p>
              )}
              {error && <p className={styles.errorMessage}>{error}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}