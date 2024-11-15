"use client"

import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import Image from "next/image";
import HitmakrButton from "@/app/components/buttons/HitmakrButton";
import HitmakrMiniModal from "@/app/components/modals/HitmakrMiniModal";
import styles from "../styles/Playlist.module.css";

export default function PlaylistDetails({ playlistId, onBack }) {
    const { address, chainId: wagmiChainId } = useAccount();
    const [playlist, setPlaylist] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalContent, setModalContent] = useState({ title: "", description: "" });

    useEffect(() => {
        const fetchPlaylistDetails = async () => {
            setIsLoading(true);
            const authToken = localStorage.getItem("authToken");

            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_HITMAKR_SERVER}/playlist/playlists/${playlistId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${authToken}`,
                            "x-user-address": address,
                            "x-chain-id": wagmiChainId.toString(),
                        },
                    }
                );

                if (!response.ok) throw new Error("Failed to fetch playlist details");

                const data = await response.json();
                setPlaylist(data.playlist);
            } catch (error) {
                console.error("Error fetching playlist details:", error);
                setError(error.message);
                setModalContent({
                    title: "Error",
                    description: "Failed to load playlist details. Please try again."
                });
                setShowModal(true);
            } finally {
                setIsLoading(false);
            }
        };

        if (playlistId && address) {
            fetchPlaylistDetails();
        }
    }, [playlistId, address, wagmiChainId]);

    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <p>Loading playlist...</p>
            </div>
        );
    }

    if (error || !playlist) {
        return (
            <div className={styles.errorContainer}>
                <p>Failed to load playlist</p>
                <HitmakrButton
                    buttonWidth="150px"
                    buttonFunction={onBack}
                    buttonName="Back to Playlists"
                />
            </div>
        );
    }

    return (
        <div className={styles.playlistDetailsContainer}>

            <div className={styles.backButton}>
                <HitmakrButton
                    buttonWidth="120px"
                    buttonFunction={onBack}
                    buttonName="Back"
                    icon={<i className="fi fi-rr-arrow-left" />}
                />
            </div>

            <div className={styles.playlistHeader}>
                <div className={styles.playlistCover}>
                    <Image
                        src={playlist.imageUrl}
                        alt={playlist.name}
                        width={200}
                        height={200}
                        className={styles.coverImage}
                        priority
                    />
                </div>
                <div className={styles.playlistInfo}>
                    <h1 className={styles.playlistTitle}>{playlist.name}</h1>
                    <p className={styles.playlistDescription}>{playlist.description}</p>
                    <div className={styles.playlistMeta}>
                        <span>{playlist.totalTracks} tracks</span>
                        {playlist.isPublic ? (
                            <span className={styles.publicBadge}>Public</span>
                        ) : (
                            <span className={styles.privateBadge}>Private</span>
                        )}
                    </div>
                </div>
            </div>

            <div className={styles.tracksSection}>
                <h2>Tracks</h2>
                {playlist.tracks && playlist.tracks.length > 0 ? (
                    <div className={styles.tracksList}>
                        {playlist.tracks.map((track, index) => (
                            <div key={track.dsrcId} className={styles.trackItem}>
                                <span className={styles.trackNumber}>{index + 1}</span>
                                <span className={styles.trackId}>{track.dsrcId}</span>
                                <span className={styles.trackDate}>
                                    {new Date(track.addedAt).toLocaleDateString()}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className={styles.noTracks}>No tracks in this playlist yet</p>
                )}
            </div>

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