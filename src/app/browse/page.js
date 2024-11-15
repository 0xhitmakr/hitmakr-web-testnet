"use client";

import React, { useState, useEffect } from 'react';
import styles from "./styles/Browse.module.css";
import { useRecoilState } from 'recoil';
import LayoutStore from '../config/store/LayoutStore';
import DSRCView from '../profile/components/releases/components/DSRCView';
import LoaderWhiteSmall from '@/app/components/animations/loaders/loaderWhiteSmall';

const ITEMS_PER_PAGE = 10;

export default function BrowsePage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [results, setResults] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [layoutMetadata, setLayoutMetadata] = useRecoilState(LayoutStore.LayoutMetadata);
    const [totalResults, setTotalResults] = useState(0);

    const fetchSearchResults = async (resetResults = false) => {
        if (loading || (!hasMore && !resetResults)) return;
        
        try {
            setLoading(true);
            
            const pageToFetch = resetResults ? 1 : currentPage;
            
            const queryParams = new URLSearchParams({
                page: pageToFetch.toString(),
                limit: ITEMS_PER_PAGE.toString()
            });

            if (layoutMetadata.searchInput?.trim()) {
                queryParams.append('title', layoutMetadata.searchInput.trim());
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_HITMAKR_SERVER}/song/search?${queryParams}`);
            if (!response.ok) throw new Error('Failed to fetch results');
            
            const data = await response.json();
            
            setResults(prev => resetResults ? data.songs : [...prev, ...data.songs]);
            setTotalResults(data.pagination.totalSongs);
            
            setHasMore(pageToFetch < data.pagination.totalPages);
            setCurrentPage(resetResults ? 2 : pageToFetch + 1);
            
        } catch (err) {
            setError(err.message);
            console.error('Error fetching results:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setResults([]);
        setCurrentPage(1);
        setHasMore(true);
        
        if (layoutMetadata.searchInput?.trim()) {
            fetchSearchResults(true);
        }
    }, [layoutMetadata.searchInput]);

    useEffect(() => {
        if (!layoutMetadata.searchInput && results.length === 0) {
            fetchSearchResults(true);
        }
    }, []);

    return (
        <div className={styles.container}>
            <div className={styles.mainContent}>
                {totalResults > 0 && (
                    <div className={styles.resultsCount}>
                        Found {totalResults} result{totalResults !== 1 ? 's' : ''}
                        {layoutMetadata.searchInput ? ` for "${layoutMetadata.searchInput}"` : ''}
                    </div>
                )}

                {error && (
                    <div className={styles.error}>
                        {error}
                    </div>
                )}

                {results.length > 0 && (
                    <div className={styles.resultsGrid}>
                        {results.map((song) => (
                            song.dsrcId ? (
                                <div key={song.songId} className={styles.dsrcItem}>
                                    <DSRCView dsrcid={song.dsrcId} />
                                </div>
                            ) : null
                        ))}
                    </div>
                )}

                {results.length === 0 && !loading && (
                    <div className={styles.noResults}>
                        <h3>No results found</h3>
                        <p>Try different search terms</p>
                    </div>
                )}

                {hasMore && (
                    <div className={styles.loadMore}>
                        <button
                            onClick={() => fetchSearchResults(false)}
                            disabled={loading}
                            className={styles.loadMoreButton}
                        >
                            {loading ? <LoaderWhiteSmall /> : <i className="fi fi-sr-arrow-circle-down"></i>}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}