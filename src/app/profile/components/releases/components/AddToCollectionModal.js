"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import Image from "next/image";
import styles from "../styles/AddToPlaylistModal.module.css";
import LoaderWhiteSmall from "@/app/components/animations/loaders/loaderWhiteSmall";
import RouterPushLink from "@/app/helpers/RouterPushLink";

export default function AddToCollectionModal({
  dsrcId,
  onClose,
  showSuccessMessage = (title, description) => {},
}) {
  const { address, chainId: wagmiChainId } = useAccount();
  const searchDebounceRef = useRef(null);
  const { routeTo } = RouterPushLink();

  const [collections, setCollections] = useState([]);
  const [originalCollections, setOriginalCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [sortBy, setSortBy] = useState("Recents");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [addingToCollection, setAddingToCollection] = useState(false);

  const fetchCollections = async () => {
    if (!address) return;

    setLoading(true);
    const authToken = localStorage.getItem("@appkit/siwx-auth-token");
    const nonceToken = localStorage.getItem("@appkit/siwx-nonce-token");

    try {
      if (!authToken || !nonceToken) {
        throw new Error(
          "Authentication required. Please reconnect your wallet."
        );
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_HITMAKR_SERVER}/collection/user-collections`,
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
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch collections");
      }

      const data = await response.json();
      setCollections(data.collections);
      setOriginalCollections(data.collections);
      setError(null);
    } catch (error) {
      console.error("Error fetching collections:", error);
      setError(error.message || "Failed to load collections");
    } finally {
      setLoading(false);
    }
  };

  const addToCollection = async (collectionId) => {
    if (!address || !dsrcId || !collectionId) {
      showSuccessMessage(
        "Error",
        "Missing required information to add to collection."
      );
      return;
    }

    setAddingToCollection(true);
    const authToken = localStorage.getItem("@appkit/siwx-auth-token");
    const nonceToken = localStorage.getItem("@appkit/siwx-nonce-token");

    try {
      if (!authToken || !nonceToken) {
        throw new Error(
          "Authentication required. Please reconnect your wallet."
        );
      }

      const checkResponse = await fetch(
        `${process.env.NEXT_PUBLIC_HITMAKR_SERVER}/collection/collections/${collectionId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "x-nonce-token": nonceToken,
            "x-user-address": address,
            "x-chain-id": wagmiChainId.toString(),
          },
        }
      );

      if (!checkResponse.ok) {
        const errorData = await checkResponse.json();
        throw new Error(errorData.message || "Failed to check collection");
      }

      const collectionData = await checkResponse.json();
      const isDSRCInCollection = collectionData.collection.tracks?.some(
        (track) => track.dsrcId === dsrcId
      );

      if (isDSRCInCollection) {
        showSuccessMessage(
          "Already Added",
          "This DSRC is already in the collection."
        );
        return;
      }

      // Add DSRC to collection
      const addResponse = await fetch(
        `${process.env.NEXT_PUBLIC_HITMAKR_SERVER}/collection/collections/${collectionId}/tracks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
            "x-nonce-token": nonceToken,
            "x-user-address": address,
            "x-chain-id": wagmiChainId.toString(),
          },
          body: JSON.stringify({
            dsrcIds: [dsrcId],
          }),
        }
      );

      if (!addResponse.ok) {
        const errorData = await addResponse.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Failed to add DSRC to collection"
        );
      }

      await addResponse.json();

      showSuccessMessage(
        "Added to Collection",
        "DSRC has been added to your collection successfully!"
      );
      onClose();
    } catch (error) {
      console.error("Error adding to collection:", error);
      let errorMessage = "Failed to add DSRC to collection. Please try again.";

      if (error.message.includes("already exists")) {
        errorMessage = "This DSRC is already in the collection.";
      } else if (error.message.includes("not found")) {
        errorMessage = "Collection not found.";
      } else if (error.message.includes("unauthorized")) {
        errorMessage = "You don't have permission to modify this collection.";
      } else if (error.message.includes("Authentication required")) {
        errorMessage = "Please reconnect your wallet.";
      }

      showSuccessMessage("Error", errorMessage);
    } finally {
      setAddingToCollection(false);
    }
  };

  const filterCollections = (
    query,
    collectionsToFilter = originalCollections
  ) => {
    if (!query.trim()) {
      setCollections(collectionsToFilter);
      return;
    }

    const searchTerm = query.toLowerCase().trim();
    const filtered = collectionsToFilter.filter(
      (collection) =>
        collection.name.toLowerCase().includes(searchTerm) ||
        collection.collectionId.toLowerCase().includes(searchTerm)
    );

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

  const handleCreateCollection = () => {
    routeTo("/collection/create");
    onClose();
  };

  useEffect(() => {
    fetchCollections();
  }, [address]);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Add to Collection</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <i className="fi fi-br-cross-small"></i>
          </button>
        </div>

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
                  placeholder="Search collections"
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
          {loading ? (
            <div className={styles.loadingState}>
              <LoaderWhiteSmall />
            </div>
          ) : error ? (
            <div className={styles.errorMessage}>{error}</div>
          ) : collections.length === 0 ? (
            <div className={styles.emptyState}>
              {searchQuery ? (
                <p>No collections match your search</p>
              ) : (
                <>
                  <p>No collections found</p>
                  <button
                    onClick={handleCreateCollection}
                    className={styles.createButton}
                  >
                    <i className="fi fi-rr-album"></i> Create Collection
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className={styles.playlistsList}>
              {collections.map((collection) => (
                <button
                  key={collection.collectionId}
                  className={styles.playlistItem}
                  onClick={() => addToCollection(collection.collectionId)}
                  disabled={addingToCollection}
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
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
