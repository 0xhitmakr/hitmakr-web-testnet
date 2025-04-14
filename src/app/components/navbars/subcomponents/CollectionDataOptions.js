"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import Image from "next/image";
import LoaderWhiteSmall from "../../animations/loaders/loaderWhiteSmall";
import styles from "../styles/PlaylistDataOptions.module.css"; // Reusing same styles
import { useRecoilState } from "recoil";
import LayoutStore from "@/app/config/store/LayoutStore";
import RouterPushLink from "@/app/helpers/RouterPushLink";

export default function CollectionDataOptions() {
  const { address, chainId: wagmiChainId } = useAccount();
  const router = useRouter();
  const observer = useRef();
  const loadingRef = useRef();
  const searchDebounceRef = useRef(null);
  const [layoutMetadata, setLayoutMetadata] = useRecoilState(
    LayoutStore.LayoutMetadata
  );
  const [collections, setCollections] = useState([]);
  const [originalCollections, setOriginalCollections] = useState([]);
  const [sortBy, setSortBy] = useState("Recents");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [typeFilter, setTypeFilter] = useState(null); // For filtering by collection type
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const { routeTo } = RouterPushLink();

  const fetchCollections = async (pageNumber) => {
    if (!address || loading || (!hasMore && pageNumber > 1)) return;

    setLoading(true);

    try {
      // Get both tokens from localStorage
      const authToken = localStorage.getItem("@appkit/siwx-auth-token");
      const nonceToken = localStorage.getItem("@appkit/siwx-nonce-token");

      if (!authToken || !nonceToken) {
        throw new Error("Authentication tokens not found");
      }

      // Build query string including type filter if set
      let queryParams = `page=${pageNumber}&limit=10`;
      if (typeFilter) {
        queryParams += `&type=${typeFilter}`;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_HITMAKR_SERVER}/collection/user-collections/paginated?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "x-nonce-token": nonceToken,
            "x-user-address": address,
            "x-chain-id": wagmiChainId.toString(),
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch collections");
      }

      const data = await response.json();

      let newCollections;
      if (pageNumber === 1) {
        newCollections = data.collections;
        setOriginalCollections(data.collections);
      } else {
        newCollections = [...originalCollections, ...data.collections];
        setOriginalCollections(newCollections);
      }

      if (searchQuery) {
        filterCollections(searchQuery, newCollections);
      } else {
        setCollections(newCollections);
      }

      setHasMore(data.pagination.hasNextPage);
      setError(null);
    } catch (error) {
      console.error("Error fetching collections:", error);
      const errorMessage = error.message || "Failed to load collections";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const lastCollectionRef = useCallback(
    (node) => {
      if (loading) return;

      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  useEffect(() => {
    // Reset to page 1 when type filter changes
    setPage(1);
    setCollections([]);
    setOriginalCollections([]);
    setHasMore(true);
    fetchCollections(1);
  }, [address, typeFilter]);

  useEffect(() => {
    if (page > 1) {
      fetchCollections(page);
    }
  }, [page]);

  const filterCollections = (
    query,
    collectionsToFilter = originalCollections
  ) => {
    if (!query.trim()) {
      setCollections(collectionsToFilter);
      return;
    }

    const searchTerm = query.toLowerCase().trim();
    const filtered = collectionsToFilter.filter((collection) => {
      const nameMatch = collection.name.toLowerCase().includes(searchTerm);
      const collectionIdMatch = collection.collectionId
        .toLowerCase()
        .includes(searchTerm);
      const dsrcMatch = collection.tracks?.some((track) =>
        track.dsrcId.toLowerCase().includes(searchTerm)
      );
      const descriptionMatch = collection.description
        ?.toLowerCase()
        .includes(searchTerm);
      const typeMatch = collection.type?.toLowerCase().includes(searchTerm);

      return (
        nameMatch ||
        collectionIdMatch ||
        dsrcMatch ||
        descriptionMatch ||
        typeMatch
      );
    });

    setCollections(filtered);
  };

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      filterCollections(query);
    }, 300);
  };

  const handleCollectionClick = (collection) => {
    router.push(`/collection/${collection.collectionId}`);
    setLayoutMetadata({
      ...layoutMetadata,
      isLibraryBarActive: false,
    });
  };

  const handleSortChange = (option) => {
    setSortBy(option);
    setShowSortMenu(false);

    const sortedCollections = [...collections];
    switch (option) {
      case "Recents":
        sortedCollections.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        break;
      case "A-Z":
        sortedCollections.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
    setCollections(sortedCollections);
  };

  const handleTypeFilter = (type) => {
    setTypeFilter(type);
    setShowTypeMenu(false);
  };

  return (
    <div className={styles.libraryContainer}>
      <div className={styles.controlsContainer}>
        <div className={styles.searchAndSort}>
          <div
            className={`${styles.searchBar} ${
              isSearchExpanded ? styles.expanded : ""
            }`}
          >
            <button
              className={styles.searchButton}
              onClick={() => {
                setIsSearchExpanded(!isSearchExpanded);
                if (!isSearchExpanded) {
                  setSearchQuery("");
                  setCollections(originalCollections);
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
              onClick={() => routeTo("/profile/collection")}
            >
              <i className="fi fi-rr-add"></i>
              <span>Create</span>
            </button>

            <button
              className={styles.sortButton}
              onClick={() => setShowTypeMenu(!showTypeMenu)}
            >
              <i className="fi fi-rr-filter"></i>
              {typeFilter && <span className={styles.filterIndicator}></span>}
            </button>
            {showTypeMenu && (
              <div className={styles.sortMenu}>
                <button
                  className={typeFilter === null ? styles.active : ""}
                  onClick={() => handleTypeFilter(null)}
                >
                  All Types
                </button>
                <button
                  className={typeFilter === "album" ? styles.active : ""}
                  onClick={() => handleTypeFilter("album")}
                >
                  Albums
                </button>
                <button
                  className={typeFilter === "mixtape" ? styles.active : ""}
                  onClick={() => handleTypeFilter("mixtape")}
                >
                  Mixtapes
                </button>
                <button
                  className={typeFilter === "pack" ? styles.active : ""}
                  onClick={() => handleTypeFilter("pack")}
                >
                  Packs
                </button>
              </div>
            )}

            <button
              className={styles.sortButton}
              onClick={() => setShowSortMenu(!showSortMenu)}
            >
              <i className="fi fi-rr-sort"></i>
            </button>
            {showSortMenu && (
              <div className={styles.sortMenu}>
                <button
                  className={sortBy === "Recents" ? styles.active : ""}
                  onClick={() => handleSortChange("Recents")}
                >
                  Recents
                </button>
                <button
                  className={sortBy === "A-Z" ? styles.active : ""}
                  onClick={() => handleSortChange("A-Z")}
                >
                  A-Z
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.playlistsContainer}>
        {collections.length === 0 && !loading ? (
          <div className={styles.emptyState}>
            {searchQuery ? (
              <p>No collections match your search</p>
            ) : typeFilter ? (
              <p>No {typeFilter} collections found</p>
            ) : (
              <p>No collections found</p>
            )}
          </div>
        ) : (
          <div className={styles.playlistsList}>
            {collections.map((collection, index) => (
              <div
                key={collection.collectionId}
                ref={
                  index === collections.length - 1 ? lastCollectionRef : null
                }
                className={styles.playlistItem}
                onClick={() => handleCollectionClick(collection)}
              >
                <div className={styles.playlistImageContainer}>
                  <Image
                    src={
                      collection.imageUrl ||
                      "https://api.dicebear.com/9.x/shapes/svg?seed=collection"
                    }
                    alt={collection.name}
                    width={48}
                    height={48}
                    className={styles.playlistImage}
                    unoptimized
                  />
                </div>
                <div className={styles.playlistInfo}>
                  <h4 className={styles.playlistName}>{collection.name}</h4>
                  <p className={styles.playlistMeta}>
                    {collection.type || "Album"} • {collection.totalTracks}{" "}
                    {collection.totalTracks === 1 ? "DSRC" : "DSRCs"}
                  </p>
                </div>
              </div>
            ))}
            <div ref={loadingRef} className={styles.loadingState}>
              {loading && <LoaderWhiteSmall />}
              {!hasMore && collections.length > 0 && (
                <p className={styles.endMessage}>No more collections</p>
              )}
              {error && <p className={styles.errorMessage}>{error}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
