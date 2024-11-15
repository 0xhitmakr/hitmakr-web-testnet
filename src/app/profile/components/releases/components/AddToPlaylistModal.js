"use client"

import React, { useState, useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import Image from "next/image";
import styles from "../styles/AddToPlaylistModal.module.css";
import LoaderWhiteSmall from "@/app/components/animations/loaders/loaderWhiteSmall";

export default function AddToPlaylistModal({ 
    dsrcId, 
    onClose,
    showSuccessMessage = (title, description) => {} 
}) {
    const { address, chainId: wagmiChainId } = useAccount();
    const searchDebounceRef = useRef(null);

    const [playlists, setPlaylists] = useState([]);
    const [originalPlaylists, setOriginalPlaylists] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [sortBy, setSortBy] = useState('Recents');
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [addingToPlaylist, setAddingToPlaylist] = useState(false);

    const fetchPlaylists = async () => {
        if (!address) return;
        
        setLoading(true);
        const authToken = localStorage.getItem("authToken");

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_HITMAKR_SERVER}/playlist/playlists`,
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
            setPlaylists(data.playlists);
            setOriginalPlaylists(data.playlists);
            setError(null);
        } catch (error) {
            console.error("Error fetching playlists:", error);
            setError("Failed to load playlists");
        } finally {
            setLoading(false);
        }
    };


    const addToPlaylist = async (playlistId) => {
        if (!address || !dsrcId || !playlistId) {
            showSuccessMessage(
                "Error",
                "Missing required information to add to playlist."
            );
            return;
        }

        setAddingToPlaylist(true);
        const authToken = localStorage.getItem("authToken");

        try {
            const checkResponse = await fetch(
                `${process.env.NEXT_PUBLIC_HITMAKR_SERVER}/playlist/playlists/${playlistId}`,
                {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        "x-user-address": address,
                        "x-chain-id": wagmiChainId.toString(),
                    },
                }
            );

            if (!checkResponse.ok) throw new Error("Failed to check playlist");

            const playlistData = await checkResponse.json();
            const isDSRCInPlaylist = playlistData.playlist.tracks?.some(
                track => track.dsrcId === dsrcId
            );

            if (isDSRCInPlaylist) {
                showSuccessMessage(
                    "Already Added",
                    "This DSRC is already in the playlist."
                );
                setAddingToPlaylist(false);
                return;
            }

            const addResponse = await fetch(
                `${process.env.NEXT_PUBLIC_HITMAKR_SERVER}/playlist/playlists/${playlistId}/tracks`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${authToken}`,
                        "x-user-address": address,
                        "x-chain-id": wagmiChainId.toString(),
                    },
                    body: JSON.stringify({
                        dsrcIds: [dsrcId] 
                    })
                }
            );

            if (!addResponse.ok) {
                const errorData = await addResponse.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to add DSRC to playlist");
            }

            const successData = await addResponse.json();

            showSuccessMessage(
                "Added to Playlist",
                "DSRC has been added to your playlist successfully!"
            );
            onClose();
        } catch (error) {
            console.error("Error adding to playlist:", error);
            let errorMessage = "Failed to add DSRC to playlist. Please try again.";

            if (error.message.includes("already exists")) {
                errorMessage = "This DSRC is already in the playlist.";
            } else if (error.message.includes("not found")) {
                errorMessage = "Playlist not found.";
            } else if (error.message.includes("unauthorized")) {
                errorMessage = "You don't have permission to modify this playlist.";
            }

            showSuccessMessage(
                "Error",
                errorMessage
            );
        } finally {
            setAddingToPlaylist(false);
        }
    };

    const filterPlaylists = (query, playlistsToFilter = originalPlaylists) => {
        if (!query.trim()) {
            setPlaylists(playlistsToFilter);
            return;
        }

        const searchTerm = query.toLowerCase().trim();
        const filtered = playlistsToFilter.filter(playlist => 
            playlist.name.toLowerCase().includes(searchTerm) ||
            playlist.playlistId.toLowerCase().includes(searchTerm)
        );

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

    useEffect(() => {
        fetchPlaylists();
    }, [address]);

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>Add to Playlist</h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        <i className="fi fi-br-cross-small"></i>
                    </button>
                </div>

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
                                    placeholder="Search playlists"
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
                    {loading ? (
                        <div className={styles.loadingState}><LoaderWhiteSmall /></div>
                    ) : error ? (
                        <div className={styles.errorMessage}>{error}</div>
                    ) : playlists.length === 0 ? (
                        <div className={styles.emptyState}>
                            {searchQuery ? (
                                <p>No playlists match your search</p>
                            ) : (
                                <p>No playlists found</p>
                            )}
                        </div>
                    ) : (
                        <div className={styles.playlistsList}>
                            {playlists.map((playlist) => (
                                <button
                                    key={playlist.playlistId}
                                    className={styles.playlistItem}
                                    onClick={() => addToPlaylist(playlist.playlistId)}
                                    disabled={addingToPlaylist}
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
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}