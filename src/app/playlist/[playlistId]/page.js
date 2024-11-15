"use client"

import { useParams } from "next/navigation"
import React, { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import Image from 'next/image';
import ColorThief from 'colorthief';
import LoaderWhiteSmall from "@/app/components/animations/loaders/loaderWhiteSmall";
import styles from "./styles/PlaylistId2.module.css"
import Link from "next/link";
import GetUsernameByAddress from "@/app/helpers/profile/GetUsernameByAddress";
import RouterPushLink from "@/app/helpers/RouterPushLink";
import DSRCPlaylistView from "./components/DSRCPlaylistView";
import HitmakrButton from "@/app/components/buttons/HitmakrButton";
import { useMusicPlayer } from "@/app/config/audio/MusicPlayerProvider";

export default function PlaylistDetails() {
    const params = useParams();
    const playlistId = params.playlistId;
    const { address, chainId: wagmiChainId } = useAccount();
    const {routeTo ,isRouterLinkOpening} = RouterPushLink();

    const { 
        playTrack, 
        addToQueue, 
        isPlaying, 
        playPause,
        currentTrack,
        clearQueue 
    } = useMusicPlayer();

    const [playlist, setPlaylist] = useState(null);
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [dominantColor, setDominantColor] = useState('rgb(88, 56, 163)');
    const [showOptions, setShowOptions] = useState(false);
    
    const imageRef = useRef(null);
    const dropdownRef = useRef(null);
    const colorThiefRef = useRef(new ColorThief());

    const handlePlaylistPlay = async () => {
        if (tracks.length === 0) return;
        
        if (currentTrack?.dsrcId === tracks[0].dsrcId) {
            playPause();
            return;
        }

        clearQueue();
        playTrack(tracks[0].dsrcId);
        tracks.slice(1).forEach(track => addToQueue(track.dsrcId));
        
        if (hasMore) {
            try {
                let nextPage = page + 1;
                while (true) {
                    const authToken = localStorage.getItem("authToken");
                    const response = await fetch(
                        `${process.env.NEXT_PUBLIC_HITMAKR_SERVER}/playlist/playlists/${playlistId}/tracks?page=${nextPage}&limit=20`,
                        {
                            headers: {
                                Authorization: `Bearer ${authToken}`,
                                "x-user-address": address,
                                "x-chain-id": wagmiChainId?.toString() || "",
                            },
                        }
                    );

                    if (!response.ok) break;
                    
                    const data = await response.json();
                    data.tracks.forEach(track => addToQueue(track.dsrcId));
                    
                    if (!data.pagination.hasNextPage) break;
                    nextPage++;
                }
            } catch (error) {
                console.error("Error fetching additional tracks for queue:", error);
            }
        }
    };

    const getDominantColor = async (imageUrl) => {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const imageDataUrl = URL.createObjectURL(blob);
            
            return new Promise((resolve) => {
                const htmlImage = document.createElement('img');
                htmlImage.crossOrigin = 'Anonymous';
                htmlImage.src = imageDataUrl;
                
                htmlImage.onload = () => {
                    try {
                        const color = colorThiefRef.current.getColor(htmlImage);
                        URL.revokeObjectURL(imageDataUrl);
                        resolve(`rgb(${color[0]}, ${color[1]}, ${color[2]})`);
                    } catch (error) {
                        console.error('Error getting dominant color:', error);
                        resolve('rgb(88, 56, 163)');
                    }
                };
                
                htmlImage.onerror = () => {
                    URL.revokeObjectURL(imageDataUrl);
                    resolve('rgb(88, 56, 163)');
                };
            });
        } catch (error) {
            console.error('Error fetching image:', error);
            return 'rgb(88, 56, 163)';
        }
    };

    const deletePlaylist = async () => {
        if (!playlistId || !address) return;

        setDeleteLoading(true);
        const authToken = localStorage.getItem("authToken");

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_HITMAKR_SERVER}/playlist/playlists/${playlistId}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        "x-user-address": address,
                        "x-chain-id": wagmiChainId?.toString() || "",
                    },
                }
            );

            if (!response.ok) {
                throw new Error("Failed to delete playlist");
            }
            routeTo("/");
        } catch (error) {
            console.error("Error deleting playlist:", error);
            setError("Failed to delete playlist");
            setIsConfirmingDelete(false);
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleOptionClick = (option) => {
        switch(option) {
            case 'add':
                break;
            case 'delete':
                if (isConfirmingDelete) {
                    deletePlaylist();
                } else {
                    setIsConfirmingDelete(true);
                    setTimeout(() => {
                        setIsConfirmingDelete(false);
                    }, 3000);
                }
                break;
            default:
                break;
        }
        if (option !== 'delete' || isConfirmingDelete) {
            setShowOptions(false);
        }
    };

    const fetchPlaylistDetails = async () => {
        if (!playlistId || !address) {
            setLoading(false);
            return;
        }

        const authToken = localStorage.getItem("authToken");
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_HITMAKR_SERVER}/playlist/playlists/${playlistId}`,
                {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        "x-user-address": address,
                        "x-chain-id": wagmiChainId?.toString() || "",
                    },
                }
            );

            if (!response.ok) throw new Error("Failed to fetch playlist");
            const data = await response.json();
            setPlaylist(data.playlist);

            if (data.playlist.imageUrl) {
                const color = await getDominantColor(data.playlist.imageUrl);
                setDominantColor(color);
            }
        } catch (error) {
            console.error("Error fetching playlist:", error);
            setError("Failed to load playlist");
        }
    };

    const fetchTracks = async (pageNum) => {
        if (!playlistId || !address || (pageNum > 1 && !hasMore)) {
            setLoading(false);
            return;
        }

        const authToken = localStorage.getItem("authToken");
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_HITMAKR_SERVER}/playlist/playlists/${playlistId}/tracks?page=${pageNum}&limit=20`,
                {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        "x-user-address": address,
                        "x-chain-id": wagmiChainId?.toString() || "",
                    },
                }
            );

            if (!response.ok) throw new Error("Failed to fetch tracks");
            const data = await response.json();

            if (pageNum === 1) {
                setTracks(data.tracks);
            } else {
                setTracks(prev => [...prev, ...data.tracks]);
            }

            setHasMore(data.pagination.hasNextPage);
            setPage(pageNum);
        } catch (error) {
            console.error("Error fetching tracks:", error);
            setError("Failed to load tracks");
        } finally {
            setLoading(false);
        }
    };

    const handleTrackRemove = async (removedDsrcId) => {
        setTracks(prevTracks => prevTracks.filter(track => track.dsrcId !== removedDsrcId));
        
        if (playlist) {
            setPlaylist(prev => ({
                ...prev,
                totalTracks: Math.max(0, prev.totalTracks - 1)
            }));
        }
    };

    useEffect(() => {
        const initializeData = async () => {
            setLoading(true);
            setError(null);
            await fetchPlaylistDetails();
            await fetchTracks(1);
        };

        if (playlistId && address && wagmiChainId) {
            initializeData();
        }
    }, [playlistId, address, wagmiChainId]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowOptions(false);
            }
        };
    
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (loading && !playlist) {
        return <div className={styles.loadingContainer}><LoaderWhiteSmall /></div>;
    }

    if (error && !playlist) {
        return <div className={styles.errorContainer}>{error}</div>;
    }

    if (!playlist) {
        return <div className={styles.errorContainer}>Playlist not found</div>;
    }

    return (
        <div className={styles.playlistContainer} 
             style={{background: `linear-gradient(180deg, ${dominantColor}99 0%, #121212 100%)`}}>
            
            <section className={styles.playlistHeader}>
                <div className={styles.headerContent}>
                    <div className={styles.coverImage}>
                        <Image
                            ref={imageRef}
                            src={playlist.imageUrl}
                            alt={playlist.name}
                            width={232}
                            height={232}
                            className={styles.coverImg}
                            crossOrigin="anonymous"
                            priority
                        />
                        {tracks.length > 0 && (
                            <div className={styles.playOverlay}>
                                <button 
                                    onClick={handlePlaylistPlay}
                                    className={styles.playButton}
                                    aria-label={isPlaying && currentTrack === tracks[0] ? "Pause" : "Play"}
                                >
                                    <i className={`fi ${isPlaying && currentTrack === tracks[0] ? 'fi-sr-pause' : 'fi-sr-play'}`} />
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <div className={styles.playlistInfo}>
                        <span className={styles.playlistType}>Playlist</span>
                        <h1 className={styles.playlistTitle}>{playlist.name}</h1>
                        <div className={styles.playlistMeta}>
                            <Link href={`/profile?address=${playlist.creator}`} 
                                  className={styles.creatorName}>
                                <GetUsernameByAddress address={playlist.creator}/>
                            </Link>
                            <span className={styles.metaDivider}>•</span>
                            <span className={styles.trackCount}>
                                {playlist.totalTracks} {playlist.totalTracks === 1 ? 'DSRC' : 'DSRCs'}
                            </span>
                            <div className={styles.controlsDivider} ref={dropdownRef}>
                                <button 
                                    className={styles.moreButton}
                                    onClick={() => setShowOptions(!showOptions)}
                                    aria-label="More options"
                                >
                                    <i className="fi fi-rr-menu-dots"></i>
                                </button>

                                {showOptions && (
                                    <div className={styles.optionsDropdown}>
                                        <button 
                                            onClick={() => handleOptionClick('delete')}
                                            style={{
                                                color: isConfirmingDelete ? '#ff4444' : 'inherit',
                                            }}
                                            disabled={deleteLoading}
                                        >
                                            {deleteLoading ? (
                                                <LoaderWhiteSmall />
                                            ) : (
                                                <>
                                                    <i className="fi fi-rr-trash" />
                                                    {isConfirmingDelete ? 'Confirm delete' : 'Delete playlist'}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className={styles.tracksSection}>
                {tracks.length > 0 ? (
                    <>
                        <div className={styles.trackList}>
                            {tracks.map((track) => (
                                <DSRCPlaylistView 
                                    key={track.dsrcId}
                                    dsrcId={track.dsrcId}
                                    playlistId={playlistId}
                                    onRemoveSuccess={handleTrackRemove}
                                />
                            ))}
                        </div>
                        
                        {hasMore && (
                            <div className={styles.loadMore}>
                                <button
                                    onClick={() => fetchTracks(page + 1)}
                                    disabled={loading}
                                    className={styles.loadMoreButton}
                                >
                                    {loading ? (
                                        <LoaderWhiteSmall />
                                    ) : (
                                        <i className="fi fi-sr-arrow-circle-down"></i>
                                    )}
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className={styles.emptyPlaylist}>
                        <i className="fi fi-rr-music-note"></i>
                        <p>This playlist is empty</p>
                        <span>Add DSRCs to get started</span>
                    </div>
                )}
            </section>

            <div className={styles.addMoreSongs}>
                <HitmakrButton 
                    buttonName="Browse"
                    isDark={true}
                    isLoading={isRouterLinkOpening("/browse")}
                    buttonWidth="25%"
                    buttonFunction={() => routeTo("/browse")}
                />
            </div>
        </div>
    );
}