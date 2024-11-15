"use client"

import React, { useState, useEffect } from 'react';
import LoaderWhiteSmall from "@/app/components/animations/loaders/loaderWhiteSmall";
import DSRCCard from './DSRCCard';
import AddToPlaylistModal from "../profile/components/releases/components/AddToPlaylistModal";
import HitmakrMiniModal from "@/app/components/modals/HitmakrMiniModal";
import styles from "./styles/TopLiked.module.css";
import SkeletonCard from './SkeletonCard';

const API_BASE_URL = process.env.NEXT_PUBLIC_HITMAKR_SERVER;

export default function TopLiked() {
    const [topDSRCIds, setTopDSRCIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
    const [selectedDsrcId, setSelectedDsrcId] = useState(null);
    const [modalState, setModalState] = useState({
        show: false,
        title: "",
        description: ""
    });

    useEffect(() => {
        const fetchTopLiked = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/heart/top-liked?days=7&limit=10`);
                if (!response.ok) throw new Error('Failed to fetch top DSRCs');
                const data = await response.json();
                setTopDSRCIds(data.results.map(result => result.dsrcId));
            } catch (error) {
                console.error('Error fetching top DSRCs:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTopLiked();
    }, []);

    const handleDSRCError = (dsrcId) => {
        setTopDSRCIds(prev => prev.filter(id => id !== dsrcId));
    };

    if (loading) {
        return (
            <div className={styles.topLikedContainer}>
                <h2 className={styles.sectionTitle}>Top Liked This Week</h2>
                <div className={styles.scrollContainer}>
                    {[...Array(6)].map((_, index) => (
                        <SkeletonCard key={index} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={styles.topLikedContainer}>
            <h2 className={styles.sectionTitle}>Top Liked This Week</h2>
            <div className={styles.scrollContainer}>
                {topDSRCIds.map(dsrcId => (
                    <DSRCCard 
                        key={dsrcId} 
                        dsrcId={dsrcId}
                        onError={handleDSRCError}
                        showModal={setModalState}
                        showStats={true}
                    />
                ))}
            </div>

            {showAddToPlaylist && (
                <AddToPlaylistModal
                    dsrcId={selectedDsrcId}
                    onClose={() => setShowAddToPlaylist(false)}
                    showSuccessMessage={(title, description) => 
                        setModalState({
                            show: true,
                            title,
                            description
                        })
                    }
                />
            )}

            {modalState.show && (
                <HitmakrMiniModal
                    title={modalState.title}
                    description={modalState.description}
                    closeButton={<i className="fi fi-br-cross-small"></i>}
                    closeFunction={() => setModalState({
                        show: false,
                        title: "",
                        description: ""
                    })}
                    isAction={true}
                />
            )}
        </div>
    );
}