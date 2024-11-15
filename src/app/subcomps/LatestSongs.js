"use client";

import React, { useState, useEffect } from 'react';
import styles from "./styles/TopLiked.module.css";
import DSRCView from '../profile/components/releases/components/DSRCView';
import LoaderWhiteSmall from '@/app/components/animations/loaders/loaderWhiteSmall';

const ITEMS_PER_PAGE = 10;

export default function LatestSongs() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [songs, setSongs] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalSongs: 0,
        itemsPerPage: ITEMS_PER_PAGE,
        hasNextPage: false,
        hasPrevPage: false
    });

    const fetchLatestSongs = async (resetResults = false) => {
        if (loading || (!pagination.hasNextPage && !resetResults)) return;
        
        try {
            setLoading(true);
            
            const pageToFetch = resetResults ? 1 : currentPage;
            
            const queryParams = new URLSearchParams({
                page: pageToFetch.toString(),
                limit: ITEMS_PER_PAGE.toString()
            });

            const response = await fetch(`${process.env.NEXT_PUBLIC_HITMAKR_SERVER}/song/recent?${queryParams}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch latest songs');
            }
            
            const data = await response.json();
            
            setSongs(prev => resetResults ? data.songs : [...prev, ...data.songs]);
            
            setPagination(data.pagination);
            setCurrentPage(resetResults ? 2 : pageToFetch + 1);
            
        } catch (err) {
            setError(err.message);
            console.error('Error fetching latest songs:', err);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        if (songs.length === 0) {
            fetchLatestSongs(true);
        }
    }, []);

    return (
        <div className={styles.section}>
                <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>New Releases</h2>
                </div>

            {error && (
                <div className={styles.error}>
                    {error}
                </div>
            )}

            {songs.length > 0 ? (
                <>
                    <div className={styles.gridContainer}>
                        {songs.map((song) => (
                            song.dsrcId ? (
                                <div key={song.songId} className={styles.gridItem}>
                                    <DSRCView dsrcid={song.dsrcId} />
                                </div>
                            ) : null
                        ))}
                    </div>

                    {pagination.hasNextPage && (
                        <div className={styles.loadMore}>
                            <button
                                onClick={() => fetchLatestSongs(false)}
                                disabled={loading}
                                className={styles.loadMoreButton}
                            >
                                {loading ? <LoaderWhiteSmall /> : <i className="fi fi-sr-arrow-circle-down"></i>}
                            </button>
                        </div>
                    )}
                </>
            ) : !loading ? (
                <div className={styles.noResults}>
                </div>
            ) : null}

            {loading && songs.length === 0 && (
                <div className={styles.loading}>
                    <LoaderWhiteSmall />
                </div>
            )}
        </div>
    );
}