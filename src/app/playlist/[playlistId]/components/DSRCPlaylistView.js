"use client"

import React, { useState, useRef, useEffect } from "react";
import styles from "../styles/DSRCPlaylistView.module.css";
import { useGetDSRC } from "@/app/config/hitmakrdsrcfactory/hitmakrDSRCFactoryRPC";
import { useGetDSRCDetails } from "@/app/config/hitmakrdsrc/hitmakrDSRCRPC";
import Image from "next/image";
import '@flaticon/flaticon-uicons/css/all/all.css';
import LoaderWhiteSmall from "@/app/components/animations/loaders/loaderWhiteSmall";
import { useAccount } from "wagmi";
import HitmakrMiniModal from "@/app/components/modals/HitmakrMiniModal";
import { useMusicPlayer } from "@/app/config/audio/MusicPlayerProvider";

export default function DSRCPlaylistView({ dsrcId, playlistId, onRemoveSuccess }) {

    const {
        playTrack,
        playPause,
        isPlaying,
        currentTrack,
        addToQueue,
    } = useMusicPlayer();


    const [showDropdown, setShowDropdown] = useState(false);
    const [copyText, setCopyText] = useState("Copy DSRC");
    const [metadata, setMetadata] = useState(null);
    const [modalState, setModalState] = useState({
        show: false,
        title: "",
        description: ""
    });
    

    const dropdownRef = useRef(null);


    const { address, chainId: wagmiChainId } = useAccount();
    

    const { dsrcAddress, isLoading: addressLoading } = useGetDSRC(dsrcId);
    const { details, loading: detailsLoading } = useGetDSRCDetails(dsrcAddress);


    const isLoading = addressLoading || detailsLoading;


    const isThisTrackPlaying = currentTrack === dsrcId && isPlaying;


    const handlePlayPause = () => {
        if (currentTrack === dsrcId) {
            playPause();
        } else {
            playTrack(dsrcId);
        }
    };

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
                setCopyText("Copy DSRC");
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchMetadata = async () => {
            if (details?.tokenUri) {
                try {
                    const response = await fetch(details.tokenUri);
                    if (!response.ok) throw new Error('Failed to fetch metadata');
                    const data = await response.json();
                    setMetadata(data);
                } catch (error) {
                    console.error("Error fetching metadata:", error);
                    setMetadata(null);
                }
            }
        };

        fetchMetadata();
    }, [details?.tokenUri]);

    const truncateText = (text, maxLength = 15) => {
        if (typeof text !== 'string') return text;
        return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
    };

    const handleCopyAddress = async () => {
        try {
            await navigator.clipboard.writeText(dsrcAddress);
            setCopyText("Copied!");
            setTimeout(() => {
                setCopyText("Copy DSRC");
                setShowDropdown(false);
            }, 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
            setModalState({
                show: true,
                title: "Copy Failed",
                description: "Failed to copy DSRC address."
            });
        }
    };

    const handleAddToQueue = () => {
        addToQueue(dsrcId);
        setModalState({
            show: true,
            title: "Added to Queue",
            description: "DSRC has been added to your queue"
        });
        setShowDropdown(false);
    };

    const handleRemoveFromPlaylist = async () => {
        if (!playlistId || !address || !dsrcId) return;

        const authToken = localStorage.getItem("authToken");
        
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_HITMAKR_SERVER}/playlist/playlists/${playlistId}/tracks`,
                {
                    method: 'DELETE',
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

            if (!response.ok) {
                throw new Error("Failed to remove from playlist");
            }

            if (typeof onRemoveSuccess === 'function') {
                onRemoveSuccess(dsrcId);
            }

            setModalState({
                show: true,
                title: "Removed from Playlist",
                description: "DSRC has been removed from the playlist."
            });
            
        } catch (error) {
            console.error("Error removing from playlist:", error);
            setModalState({
                show: true,
                title: "Error",
                description: "Failed to remove DSRC from playlist."
            });
        }
        setShowDropdown(false);
    };

    const handleOptionClick = (option) => {
        switch(option) {
            case 'copy':
                handleCopyAddress();
                break;
            case 'remove':
                handleRemoveFromPlaylist();
                break;
            case 'queue':
                handleAddToQueue();
                break;
            default:
                setShowDropdown(false);
        }
    };

    if (isLoading || !metadata) {
        return <div className={styles.loading}><LoaderWhiteSmall /></div>;
    }

    if (!details) {
        return <div className={styles.error}><LoaderWhiteSmall /></div>;
    }

    return (
        <>
            <div className={styles.dsrcPlaylistItem}>
                <div className={styles.dsrcContent}>
                    <div className={styles.imageContainer}>
                        <Image 
                            src={metadata.image} 
                            width={48} 
                            height={48} 
                            alt={`${metadata.name} only on Hitmakr`}
                            className={styles.coverImage}
                            unoptimized
                        />
                        <div className={styles.playOverlay}>
                            <button 
                                onClick={handlePlayPause}
                                className={`${styles.playButton} ${isThisTrackPlaying ? styles.playing : ''}`}
                                aria-label={isThisTrackPlaying ? "Pause" : "Play"}
                            >
                                <i className={`fi ${isThisTrackPlaying ? 'fi-sr-pause' : 'fi-sr-play'}`} />
                            </button>
                        </div>
                    </div>

                    <div className={styles.dsrcInfo}>
                        <h3 className={styles.dsrcName}>{truncateText(metadata.name, 30)}</h3>
                        <p className={styles.dsrcId}>{dsrcId}</p>
                    </div>

                    <div className={styles.menuContainer} ref={dropdownRef}>
                        <button 
                            className={styles.menuButton}
                            onClick={() => setShowDropdown(!showDropdown)}
                            aria-label="More options"
                        >
                            <i className="fi fi-sr-menu-dots-vertical" />
                        </button>
                        {showDropdown && (
                            <div className={styles.dropdown}>
                                <button onClick={() => handleOptionClick('copy')}>
                                    <i className={`fi ${copyText === "Copied!" ? "fi-rr-check" : "fi-rr-copy"}`} />
                                    {copyText}
                                </button>
                                <button onClick={() => handleOptionClick('queue')}>
                                    <i className="fi fi-rr-queue" />
                                    Add to queue
                                </button>
                                <button 
                                    onClick={() => handleOptionClick('remove')}
                                    className={styles.removeButton}
                                >
                                    <i className="fi fi-rr-trash" />
                                    Remove from playlist
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {modalState.show && (
                <HitmakrMiniModal
                    title={modalState.title}
                    description={modalState.description}
                    closeButton={<i className="fi fi-br-cross-small"></i>}
                    closeFunction={() => {
                        setModalState({
                            show: false,
                            title: "",
                            description: ""
                        });
                    }}
                    isAction={true}
                />
            )}
        </>
    );
}