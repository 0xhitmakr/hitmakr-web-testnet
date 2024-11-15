"use client"

import { useRef, useEffect, useState } from 'react';
import { useMusicPlayer } from '@/app/config/audio/MusicPlayerProvider';
import '@flaticon/flaticon-uicons/css/all/all.css';
import Image from 'next/image';
import styles from "./styles/MainPlayer.module.css";
import { useGetDSRC } from "@/app/config/hitmakrdsrcfactory/hitmakrDSRCFactoryRPC";
import { useGetDSRCDetails } from "@/app/config/hitmakrdsrc/hitmakrDSRCRPC";
import LoaderBlackSmall from '../../animations/loaders/loaderBlackSmall';
import QueueItem from './components/QueueItem';
import RouterPushLink from '@/app/helpers/RouterPushLink';
import GetUsernameByAddress from '@/app/helpers/profile/GetUsernameByAddress';
import { usePathname } from 'next/navigation';

export default function MainPlayer() {
    const pathname = usePathname();
    const isActiveHome = (path) => pathname === path;
    const {
        isPlaying,
        currentTrack,
        queue,
        isShuffle,
        isRepeat,
        playPause,
        nextTrack,
        toggleShuffle,
        toggleRepeat,
        playTrack,
        previousTrack,
        playHistory,
        clearQueue
    } = useMusicPlayer();

    const [showQueue, setShowQueue] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [metadata, setMetadata] = useState(null);
    const [isBuffering, setIsBuffering] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [loadedProgress, setLoadedProgress] = useState(0);
    const {routeTo} = RouterPushLink();
    const [isTrackLoaded, setIsTrackLoaded] = useState(false);
    const [isSeeking, setIsSeeking] = useState(false);

    const audioRef = useRef(null);
    const isTransitioningRef = useRef(false);
    const mediaSourceRef = useRef(null);
    const sourceBufferRef = useRef(null);
    const cleanupRef = useRef(null);
    const chunksToLoadRef = useRef([]);
    const isLoadingChunkRef = useRef(false);
    const lastPlaybackPositionRef = useRef(0);
    const loadedChunksRef = useRef(new Set());
    
    const { dsrcAddress, isLoading: addressLoading } = useGetDSRC(currentTrack);
    const { details, loading: detailsLoading } = useGetDSRCDetails(dsrcAddress);

    const PRELOAD_CHUNKS = 4;
    const CHUNK_QUEUE_KEY = 'chunkQueue';

    const loadChunkSequentially = async (chunk, chunkIndex, chunkMap, sourceBufferRef, totalChunks) => {
        if (!chunk || chunk.loaded || chunk.loading) return;
        
        if (chunkIndex > 0) {
            const previousChunk = chunkMap.get(chunkIndex - 1);
            if (!previousChunk?.loaded) {
                await loadChunkSequentially(previousChunk, chunkIndex - 1, chunkMap, sourceBufferRef, totalChunks);
            }
        }
    
        chunk.loading = true;
        let cleanup = null;
    
        try {
            const response = await fetch(`https://gateway.irys.xyz/${chunk.id}`);
            if (!response.ok) throw new Error(`Failed to fetch chunk ${chunkIndex}`);
            const buffer = await response.arrayBuffer();
    
            while (sourceBufferRef.current?.updating) {
                await new Promise(resolve => setTimeout(resolve, 10));
            }
    
            if (!sourceBufferRef.current) {
                throw new Error('SourceBuffer was removed');
            }
    
            await new Promise((resolve, reject) => {
                const handleUpdateEnd = () => {
                    cleanup = () => {
                        if (sourceBufferRef.current) {
                            sourceBufferRef.current.removeEventListener('updateend', handleUpdateEnd);
                            sourceBufferRef.current.removeEventListener('error', handleError);
                        }
                    };
                    chunk.loaded = true;
                    chunk.loading = false;
                    resolve();
                };
    
                const handleError = (error) => {
                    cleanup = () => {
                        if (sourceBufferRef.current) {
                            sourceBufferRef.current.removeEventListener('updateend', handleUpdateEnd);
                            sourceBufferRef.current.removeEventListener('error', handleError);
                        }
                    };
                    chunk.loading = false;
                    reject(error);
                };
    
                sourceBufferRef.current.addEventListener('updateend', handleUpdateEnd);
                sourceBufferRef.current.addEventListener('error', handleError);
    
                try {
                    sourceBufferRef.current.appendBuffer(buffer);
                } catch (error) {
                    cleanup?.();
                    reject(error);
                }
            });
    
            if (chunkIndex < totalChunks - 1) {
                const nextChunk = chunkMap.get(chunkIndex + 1);
                if (nextChunk?.loaded && !chunk.loaded) {
                    await loadChunkSequentially(chunk, chunkIndex, chunkMap, sourceBufferRef, totalChunks);
                }
            }
        } catch (error) {
            console.error(`Error loading chunk ${chunkIndex}:`, error);
            chunk.loading = false;
            cleanup?.();
            
            if (!chunk.retryCount || chunk.retryCount < 3) {
                chunk.retryCount = (chunk.retryCount || 0) + 1;
                await new Promise(resolve => setTimeout(resolve, 1000 * chunk.retryCount)); // Exponential backoff
                return loadChunkSequentially(chunk, chunkIndex, chunkMap, sourceBufferRef, totalChunks);
            }
            
            throw error;
        } finally {
            cleanup?.();
        }
    };

    const loadNextChunk = async () => {
        if (!mediaSourceRef.current || mediaSourceRef.current.readyState !== 'open' || !sourceBufferRef.current || !chunksToLoadRef.current.length) return;

        const chunkId = chunksToLoadRef.current.shift();
        try {
            const response = await fetch(`https://gateway.irys.xyz/${chunkId}`);
            const buffer = await response.arrayBuffer();

            await new Promise((resolve, reject) => {
                sourceBufferRef.current.appendBuffer(buffer);
                sourceBufferRef.current.addEventListener('updateend', resolve, { once: true });
                sourceBufferRef.current.addEventListener('error', reject, { once: true });
            });

            if (chunksToLoadRef.current.length > 0) {
                loadNextChunk(); 
            } else if (mediaSourceRef.current && mediaSourceRef.current.readyState === 'open') {
                mediaSourceRef.current.endOfStream();
            }
        } catch (error) {
            console.error('Error loading chunk:', error);
        }
    };

    const preloadChunks = async (currentChunkIndex, chunkMap, totalChunks, loadChunk) => {
        const endIndex = Math.min(currentChunkIndex + PRELOAD_CHUNKS, totalChunks - 1);
        const preloadPromises = [];
    
        for (let i = currentChunkIndex; i <= endIndex; i++) {
            const chunk = chunkMap.get(i);
            if (!chunk?.loaded && !chunk?.loading) {
                preloadPromises.push(loadChunk(i));
            }
        }
    
        if (preloadPromises.length > 0) {
            try {
                await Promise.all(preloadPromises);
            } catch (error) {
                console.error('Error preloading chunks:', error);
            }
        }
    };

    useEffect(() => {   
        if (!audioRef.current || !sourceBufferRef.current) return;

        const handleTimeUpdate = () => {
            if (!audioRef.current || !sourceBufferRef.current) return;

            const buffered = sourceBufferRef.current.buffered;
            const currentTime = audioRef.current.currentTime;
            
            if (buffered.length > 0) {
                const bufferedEnd = buffered.end(buffered.length - 1);
                if (bufferedEnd - currentTime < 10 && chunksToLoadRef.current.length > 0) {
                    loadNextChunk();
                }
            }
        };

        audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
        return () => {
            if (audioRef.current) {
                audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
            }
        };
    }, []);

    const parseMetadataDuration = (durationStr) => {
        const parts = durationStr.split(':').map(Number);
        if (parts.length === 3) {
            const [hours, minutes, seconds] = parts;
            return (hours * 3600) + (minutes * 60) + seconds;
        }
        if (parts.length === 2) {
            const [minutes, seconds] = parts;
            return (minutes * 60) + seconds;
        }
        return 0;
    };

    const cleanupMediaResources = () => {
        try {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
                
                audioRef.current.onplay = null;
                audioRef.current.onpause = null;
                audioRef.current.ontimeupdate = null;
                audioRef.current.onended = null;
                audioRef.current.onerror = null;
                audioRef.current.onwaiting = null;
                audioRef.current.onseeking = null;
                audioRef.current.onseeked = null;
                audioRef.current.onloadedmetadata = null;
                
                // Clear source
                audioRef.current.src = '';
                audioRef.current.removeAttribute('src');
                audioRef.current.load();
            }
    
            if (sourceBufferRef.current && mediaSourceRef.current) {
                try {
                    sourceBufferRef.current.abort();
                    
                    if (sourceBufferRef.current.buffered.length > 0) {
                        sourceBufferRef.current.remove(0, Infinity);
                    }
    
                    const waitForRemoval = new Promise((resolve) => {
                        if (sourceBufferRef.current.updating) {
                            sourceBufferRef.current.addEventListener('updateend', resolve, { once: true });
                        } else {
                            resolve();
                        }
                    });
                    waitForRemoval.then(() => {
                        if (mediaSourceRef.current && mediaSourceRef.current.readyState === 'open') {
                            try {
                                mediaSourceRef.current.removeSourceBuffer(sourceBufferRef.current);
                            } catch (e) {
                                console.error('Error removing source buffer:', e);
                            }
                        }
                    });
                } catch (e) {
                    console.error('Error cleaning source buffer:', e);
                }
            }
    
            if (audioRef.current?.src) {
                URL.revokeObjectURL(audioRef.current.src);
            }
    
            if (cleanupRef.current) {
                cleanupRef.current();
                cleanupRef.current = null;
            }
    
            mediaSourceRef.current = null;
            sourceBufferRef.current = null;
            chunksToLoadRef.current = [];
            loadedChunksRef.current.clear();
            lastPlaybackPositionRef.current = 0;
            isLoadingChunkRef.current = false;
    
            setCurrentTime(0);
            setDuration(0);
            setIsBuffering(false);
            setIsInitialLoading(true);
            setLoadedProgress(0);
            setIsTrackLoaded(false);
        } catch (error) {
            console.error('Error in cleanup:', error);
        }
    };
    
    const waitForSourceOpen = (mediaSource) => {
        return new Promise((resolve) => {
            if (mediaSource.readyState === 'open') {
                resolve();
            } else {
                mediaSource.addEventListener('sourceopen', () => resolve(), { once: true });
            }
        });
    };
    
    const resetForNewTrack = async () => {
        cleanupMediaResources();
        
        // Clear any pending timeouts
        if (window.loadingTimeout) {
            clearTimeout(window.loadingTimeout);
        }
    
        try {
            const newMediaSource = new MediaSource();
            mediaSourceRef.current = newMediaSource;
            
            const mediaSourceUrl = URL.createObjectURL(newMediaSource);
            
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
                audioRef.current.src = mediaSourceUrl;
            }
    
            await new Promise((resolve, reject) => {
                const timeoutId = setTimeout(() => reject(new Error('MediaSource open timeout')), 5000);
                newMediaSource.addEventListener('sourceopen', () => {
                    clearTimeout(timeoutId);
                    resolve();
                }, { once: true });
            });
    
            if (newMediaSource.readyState === 'open') {
                sourceBufferRef.current = newMediaSource.addSourceBuffer('audio/mpeg');
            }
        } catch (error) {
            console.error('Error resetting track:', error);
            cleanupMediaResources(); 
            throw error;
        }
    };
    

    

    useEffect(() => {
        let isCurrentTrack = true;
        
        return () => {
            isCurrentTrack = false;
            cleanupMediaResources();
        };
    }, [currentTrack, details]);



    //========CORE=============
    useEffect(() => {
        let isCurrentTrack = true;
    
        const setupNewTrack = async () => {
            if (!currentTrack || !details?.tokenUri || !audioRef.current) return;
            
            try {
                setIsTrackLoaded(false);
                await cleanupMediaResources();
                
                const newMediaSource = new MediaSource();
                mediaSourceRef.current = newMediaSource;
                const mediaSourceUrl = URL.createObjectURL(newMediaSource);
        
                const sourceOpenPromise = new Promise((resolve, reject) => {
                    const timeoutId = setTimeout(() => reject(new Error('MediaSource open timeout')), 5000);
                    
                    newMediaSource.addEventListener('sourceopen', () => {
                        clearTimeout(timeoutId);
                        try {
                            sourceBufferRef.current = newMediaSource.addSourceBuffer('audio/mpeg');
                            resolve();
                        } catch (error) {
                            reject(error);
                        }
                    }, { once: true });
                });
        
                audioRef.current.src = mediaSourceUrl;
                
                await sourceOpenPromise;
                
                const response = await fetch(details.tokenUri);
                if (!response.ok) throw new Error('Failed to fetch metadata');
                const data = await response.json();
                
                setMetadata(data);
                setIsInitialLoading(true);
        
                const durationAttr = data.attributes.find(attr => attr.trait_type === 'Duration');
                const totalDuration = durationAttr?.value ? parseMetadataDuration(durationAttr.value) : 0;
                setDuration(totalDuration);
        
                const totalChunks = data.audio.length;
                const chunkDuration = totalDuration / totalChunks;
                
                const chunkMap = new Map();
                data.audio.forEach((id, i) => {
                    chunkMap.set(i, {
                        startTime: i * chunkDuration,
                        endTime: (i + 1) * chunkDuration,
                        loaded: false,
                        loading: false,
                        id: id
                    });
                });
        
                let isCurrentTrackRef = true; 
        
                const loadChunk = async (index) => {
                    if (!isCurrentTrackRef) return;
                    const chunk = chunkMap.get(index);
                    if (!chunk || chunk.loaded || chunk.loading) return;
                    
                    try {
                        chunk.loading = true;
                        const response = await fetch(`https://gateway.irys.xyz/${chunk.id}`);
                        if (!response.ok) throw new Error(`Failed to fetch chunk ${index}`);
                        const buffer = await response.arrayBuffer();
        
                        if (!isCurrentTrackRef || !sourceBufferRef.current) return;
        
                        while (sourceBufferRef.current?.updating) {
                            await new Promise(resolve => setTimeout(resolve, 10));
                        }
        
                        await new Promise((resolve, reject) => {
                            if (!sourceBufferRef.current) {
                                reject(new Error('SourceBuffer not available'));
                                return;
                            }
        
                            const handleUpdateEnd = () => {
                                sourceBufferRef.current?.removeEventListener('updateend', handleUpdateEnd);
                                sourceBufferRef.current?.removeEventListener('error', handleError);
                                chunk.loaded = true;
                                chunk.loading = false;
                                const loadedChunks = Array.from(chunkMap.values()).filter(c => c.loaded).length;
                                setLoadedProgress((loadedChunks / totalChunks) * 100);
                                resolve();
                            };
        
                            const handleError = (error) => {
                                sourceBufferRef.current?.removeEventListener('updateend', handleUpdateEnd);
                                sourceBufferRef.current?.removeEventListener('error', handleError);
                                chunk.loading = false;
                                reject(error);
                            };
        
                            sourceBufferRef.current.addEventListener('updateend', handleUpdateEnd);
                            sourceBufferRef.current.addEventListener('error', handleError);
        
                            try {
                                sourceBufferRef.current.appendBuffer(buffer);
                            } catch (error) {
                                handleError(error);
                            }
                        });
                    } catch (error) {
                        console.error(`Error loading chunk ${index}:`, error);
                        chunk.loading = false;
                        if (!chunk.retryCount || chunk.retryCount < 3) {
                            chunk.retryCount = (chunk.retryCount || 0) + 1;
                            await new Promise(resolve => setTimeout(resolve, 1000 * chunk.retryCount));
                            await loadChunk(index);
                        }
                    }
                };
        
                const loadChunksSequentially = async (startIndex, count) => {
                    if (!isCurrentTrackRef) return;
                    const endIndex = Math.min(startIndex + count, totalChunks);
                    for (let i = startIndex; i < endIndex; i++) {
                        await loadChunk(i);
                        if (!isCurrentTrackRef) break;
                    }
                };
        
                const handleTimeUpdate = async () => {
                    if (!audioRef.current || !isCurrentTrackRef) return;
                    
                    const currentTime = audioRef.current.currentTime;
                    const currentChunkIndex = Math.floor(currentTime / chunkDuration);
                    
                    for (let i = 1; i <= 3; i++) {
                        const nextChunkIndex = currentChunkIndex + i;
                        const nextChunk = chunkMap.get(nextChunkIndex);
                        if (nextChunk && !nextChunk.loaded && !nextChunk.loading) {
                            loadChunk(nextChunkIndex).catch(console.error);
                            break;
                        }
                    }
                };
        
                const handleSeeking = async () => {
                    if (!audioRef.current || !isCurrentTrackRef) return;
                    const seekTime = audioRef.current.currentTime;
                    const seekChunkIndex = Math.floor(seekTime / chunkDuration);
                    
                    setIsBuffering(true);
                    try {
                        await loadChunksSequentially(seekChunkIndex, 3);
                    } finally {
                        setIsBuffering(false);
                    }
                };
        
                audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
                audioRef.current.addEventListener('seeking', handleSeeking);
        
                try {
                    await loadChunksSequentially(0, 3);
                    setIsInitialLoading(false);
                    setIsTrackLoaded(true);
        
                    // Background load remaining chunks
                    loadChunksSequentially(3, totalChunks - 3).catch(console.error);
                } catch (error) {
                    console.error('Initial chunk loading error:', error);
                    setIsInitialLoading(false);
                    throw error;
                }
        
                cleanupRef.current = () => {
                    isCurrentTrackRef = false;
                    if (audioRef.current) {
                        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
                        audioRef.current.removeEventListener('seeking', handleSeeking);
                    }
                };
        
            } catch (error) {
                console.error('Error setting up track:', error);
                cleanupMediaResources();
                setMetadata(null);
                setIsBuffering(false);
                setIsInitialLoading(false);
                setIsTrackLoaded(false);
            }
        };
    
        if (currentTrack && details) {
            setupNewTrack();
        }
    
        return () => {
            isCurrentTrack = false;
            cleanupMediaResources();
        };
    }, [currentTrack, details]);

    
    
    useEffect(() => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.currentTime = lastPlaybackPositionRef.current;
                audioRef.current.play().catch(console.error);
            } else {
                lastPlaybackPositionRef.current = audioRef.current.currentTime;
                audioRef.current.pause();
            }
        }
    }, [isPlaying]);
    


    

    useEffect(() => {
        if (!audioRef.current) return;
    
        const handlePlayPause = async () => {
            try {
                if (isPlaying) {
                    audioRef.current.volume = volume;
                    await audioRef.current.play();
                } else {
                    audioRef.current.pause();
                }
            } catch (error) {
                if (error.name === 'AbortError') {
                    return;
                }
                console.error('Playback control error:', error);
            }
        };
    
        handlePlayPause();
    }, [isPlaying, volume]);

    useEffect(() => {
        if (!audioRef.current || !isTrackLoaded) return;

        const handlePlayPause = async () => {
            try {
                if (isPlaying) {
                    audioRef.current.volume = volume;
                    await audioRef.current.play();
                } else {
                    audioRef.current.pause();
                }
            } catch (error) {
                if (error.name === 'AbortError') {
                    return;
                }
                console.error('Playback control error:', error);
            }
        };

        handlePlayPause();
    }, [isPlaying, volume, isTrackLoaded]);


    const defaultDisplayValues = {
        title: 'No track playing',
        artist: 'No artist',
        duration: 0,
        image: 'https://api.dicebear.com/9.x/glass/svg?seed=hitmakr',
    };

    const noMusicPlaying = !currentTrack;
    const isLoading = addressLoading || detailsLoading;
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        setIsMuted(newVolume === 0);
        if (audioRef.current) {
            audioRef.current.volume = newVolume;
        }
    };

    const handleProgressChange = async (e) => {
        const time = parseFloat(e.target.value);
        setIsSeeking(true); 
        setCurrentTime(time);
        
        if (audioRef.current) {
            const wasPlaying = !audioRef.current.paused;
            if (wasPlaying) {
                audioRef.current.pause();
            }
            
            audioRef.current.currentTime = time;
            
            if (wasPlaying) {
                try {
                    await audioRef.current.play();
                } catch (error) {
                    if (error.name !== 'AbortError') {
                        console.error('Error resuming after seek:', error);
                    }
                }
            }
        }
        
        setTimeout(() => {
            setIsSeeking(false);
        }, 200);
    };

    const toggleMute = () => {
        if (isMuted) {
            setVolume(0.5);
            setIsMuted(false);
            if (audioRef.current) audioRef.current.volume = 0.5;
        } else {
            setVolume(0);
            setIsMuted(true);
            if (audioRef.current) audioRef.current.volume = 0;
        }
    };

    const handleTrackEnd = () => {
        if (audioRef.current && !audioRef.current.seeking) {
            const endedEvent = new Event('ended');
            audioRef.current.dispatchEvent(endedEvent);
        }
    };

    const handleEndedTransition = async () => {
        if (isTransitioningRef.current || !audioRef.current || isSeeking) return;
        isTransitioningRef.current = true;
    
        try {
            if (isRepeat && currentTrack) {
                audioRef.current.currentTime = 0;
                if (isPlaying) {
                    try {
                        await audioRef.current.play();
                    } catch (error) {
                        console.error('Error replaying track:', error);
                    }
                }
                isTransitioningRef.current = false;
                return;
            }
    
            if (queue.length > 0) {
                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                }
    
                cleanupMediaResources();
    
                nextTrack();
    
                setCurrentTime(0);
                setLoadedProgress(0);
    
                await new Promise(resolve => setTimeout(resolve, 500));
    
                if (isPlaying) {
                    try {
                        const playPromise = audioRef.current?.play();
                        if (playPromise) {
                            await playPromise;
                        }
                    } catch (error) {
                        console.error('Error auto-playing next track:', error);
                        playPause(true);
                    }
                }
            } else {
                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                }
                setCurrentTime(0);
                playPause(false);
            }
        } catch (error) {
            console.error('Error in track transition:', error);
            playPause(false);
        } finally {
            isTransitioningRef.current = false;
        }
    };
    
    useEffect(() => {
        if (!audioRef.current || !duration) return;
    
        const handleTimeUpdate = () => {
            if (!audioRef.current || isTransitioningRef.current || isSeeking) return;
    
            const currentTime = audioRef.current.currentTime;
            
            if (currentTime >= duration - 0.1 && !isTransitioningRef.current) {
                handleEndedTransition();
            }
        };
    
        audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
    
        return () => {
            if (audioRef.current) {
                audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
            }
        };
    }, [audioRef, duration, isSeeking, handleEndedTransition]);
    

    const displayValues = metadata || defaultDisplayValues;
    const progressPercent = (currentTime / duration) * 100;

    if (!isActiveHome("/auth")){
        return (
            <>
                <div className={styles.hitmakrPlayer}>
                    <div className={styles.desktopPlayer}>
                        <div className={styles.nowPlaying}>
                            <Image 
                                src={displayValues.image} 
                                alt={displayValues.name || "Now Playing"} 
                                width={56} 
                                height={56} 
                                className={styles.songCover}
                                priority
                                unoptimized={true}
                            />
                            <div className={styles.songInfo}>
                                {noMusicPlaying ? (
                                    <>
                                        <div className={styles.songTitle}>No music playing</div>
                                        <div className={styles.songArtist}>Select a track to play</div>
                                    </>
                                ) : (
                                    <>
                                        <div className={styles.songTitle} onClick={()=>routeTo(`/dsrc/${currentTrack}`)}>
                                            {isLoading ? 'Loading...' : displayValues.name}
                                        </div>
                                        <div onClick={()=>routeTo(`/profile?address=${displayValues.creator}`)} className={styles.songArtist}>
                                            {isLoading ? 'Loading...' : <GetUsernameByAddress address={displayValues.creator}/> || 'Unknown Artist'}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
    
                        <div className={styles.playerControls}>
                            <div className={`${styles.controlButtons} ${noMusicPlaying ? styles.disabled : ''}`}>
                                <button 
                                    className={`${styles.controlButton} ${isShuffle ? styles.active : ''}`}
                                    onClick={toggleShuffle}
                                    data-tooltip="Shuffle"
                                    disabled={noMusicPlaying}
                                >
                                    <i className="fi fi-sr-shuffle"></i>
                                </button>
                                
                               
                                <button 
                                    className={styles.controlButton} 
                                    onClick={previousTrack}
                                    data-tooltip="Previous"
                                    disabled={noMusicPlaying || playHistory.length === 0}
                                >
                                    <i className="fi fi-sr-rewind"></i>
                                </button>
    
                                <button 
                                    className={`${styles.playPauseButton} ${isBuffering ? styles.buffering : ''}`}
                                    onClick={playPause}
                                    disabled={noMusicPlaying || isBuffering}
                                >
                                    {isBuffering ? (
                                        <div className={styles.bufferingIndicator}>
                                            <LoaderBlackSmall />
                                        </div>
                                    ) : (
                                        <i className={`fi ${isPlaying ? 'fi-sr-pause' : 'fi-sr-play'}`}></i>
                                    )}
                                </button>
    
                                <button 
                                    className={styles.controlButton} 
                                    onClick={nextTrack}
                                    data-tooltip="Next"
                                    disabled={noMusicPlaying}
                                >
                                    <i className="fi fi-sr-forward"></i>
                                </button>
    
                                <button 
                                    className={`${styles.controlButton} ${isRepeat ? styles.active : ''}`}
                                    onClick={toggleRepeat}
                                    data-tooltip="Repeat"
                                    disabled={noMusicPlaying}
                                >
                                    <i className="fi fi-sr-refresh"></i>
                                </button>
                            </div>
    
                            <div className={styles.progressBar}>
                                <span className={styles.timeStamp}>{formatTime(currentTime)}</span>
                                <div className={styles.sliderContainer}>
                                    <div 
                                        className={styles.loadedProgress} 
                                        style={{ width: `${loadedProgress}%` }}
                                    />
                                    <input
                                        type="range"
                                        className={`${styles.slider} ${isBuffering ? styles.buffering : ''}`}
                                        value={currentTime}
                                        onChange={handleProgressChange}
                                        min="0"
                                        max={duration}
                                        step="0.1"
                                        style={{'--progress': `${progressPercent}%`}}
                                        disabled={noMusicPlaying || isBuffering}
                                    />
                                </div>
                                <span className={styles.timeStamp}>{formatTime(duration)}</span>
                            </div>
                        </div>
    
                        <div className={styles.volumeControls}>
                            <button 
                                className={styles.queueButton}
                                onClick={() => setShowQueue(!showQueue)}
                                data-tooltip="Queue"
                            >
                                <i className="fi fi-sr-queue"></i>
                                {queue.length > 0 && (
                                    <span className={styles.queueBadge}>
                                        {queue.length}
                                    </span>
                                )}
                            </button>
    
                            <button 
                                className={`${styles.volumeButton} ${isMuted ? styles.muted : ''}`}
                                onClick={toggleMute}
                                data-tooltip="Volume"
                            >
                                <i className={`fi ${isMuted ? 'fi-sr-volume-mute' : 'fi-sr-volume'}`}></i>
                            </button>
    
                            <div className={styles.volumeSliderContainer}>
                                <input
                                    type="range"
                                    className={styles.volumeSlider}
                                    value={volume}
                                    onChange={handleVolumeChange}
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    style={{'--volume': `${volume * 100}%`}}
                                />
                            </div>
                        </div>
                    </div>
    
                    <div className={styles.mobilePlayer}>
                        <div className={styles.playerContent}>
                            <button 
                                className={styles.toggleExpandButton}
                                onClick={() => setIsExpanded(!isExpanded)}
                            >
                                <i className={`fi ${isExpanded ? 'fi-sr-angle-down' : 'fi-sr-angle-up'}`}></i>
                            </button>
    
                            <div className={styles.nowPlaying}>
                                <Image 
                                    src={displayValues.image} 
                                    alt={displayValues.name || 'No track'} 
                                    width={40} 
                                    height={40} 
                                    className={styles.songCover}
                                    priority
                                    unoptimized={true}
                                />
                                <div className={styles.songInfo}>
                                    <div className={styles.songTitle} onClick={()=>routeTo(`/dsrc/${currentTrack}`)}>
                                        {noMusicPlaying ? 'No track playing' : (isLoading ? 'Loading...' : displayValues.name)}
                                    </div>
                                    <div onClick={()=>routeTo(`/profile?address=${displayValues.creator}`)} className={styles.songArtist}>
                                        {noMusicPlaying ? 'No artist' : (isLoading ? 'Loading...' : <GetUsernameByAddress address={displayValues.creator}/>  || 'Unknown Artist')}
                                    </div>
                                </div>
                            </div>
    
                            <button 
                                className={`${styles.playPauseButton} ${isBuffering ? styles.buffering : ''}`} 
                                onClick={playPause}
                                disabled={noMusicPlaying || isBuffering}
                            >
                                {isBuffering ? (
                                    <div className={styles.bufferingIndicator}>
                                        <LoaderBlackSmall />
                                    </div>
                                ) : (
                                    <i className={`fi ${isPlaying ? 'fi-sr-pause' : 'fi-sr-play'}`}></i>
                                )}
                            </button>
    
                            <div className={styles.progressBar}>
                                <div 
                                    className={styles.loadedProgress} 
                                    style={{ width: `${loadedProgress}%` }}
                                />
                                <div 
                                    className={styles.progressIndicator} 
                                    style={{ width: `${progressPercent}%` }}
                                />
                                <input
                                    type="range"
                                    className={`${styles.slider} ${isBuffering ? styles.buffering : ''}`}
                                    value={currentTime}
                                    onChange={handleProgressChange}
                                    min="0"
                                    max={duration}
                                    step="0.1"
                                    disabled={noMusicPlaying || isBuffering}
                                />
                            </div>
                        </div>
    
                        <div className={`${styles.expandedControls} ${isExpanded ? styles.visible : ''}`}>
                            <button 
                                className={`${styles.controlButton} ${isShuffle ? styles.active : ''}`}
                                onClick={toggleShuffle}
                                disabled={noMusicPlaying}
                            >
                                <i className="fi fi-sr-shuffle"></i>
                            </button>
                            
                            <button 
                                className={styles.controlButton}
                                onClick={previousTrack}
                                disabled={noMusicPlaying || playHistory.length === 0}
                            >
                                <i className="fi fi-sr-rewind"></i>
                            </button>
    
                            <button 
                                className={styles.queueButton}
                                onClick={() => setShowQueue(!showQueue)}
                            >
                                <i className="fi fi-sr-queue"></i>
                                {queue.length > 0 && (
                                    <span className={styles.queueBadge}>
                                        {queue.length}
                                    </span>
                                )}
                            </button>
    
                            <button 
                                className={styles.controlButton}
                                onClick={nextTrack}
                                disabled={noMusicPlaying}
                            >
                                <i className="fi fi-sr-forward"></i>
                            </button>
    
                            <button 
                                className={`${styles.controlButton} ${isRepeat ? styles.active : ''}`}
                                onClick={toggleRepeat}
                                disabled={noMusicPlaying}
                            >
                                <i className="fi fi-sr-refresh"></i>
                            </button>
                        </div>
                    </div>
    
                    {showQueue && (
                        <div className={styles.queuePanel}>
                            <div className={styles.queueHeader}>
                                <h3>Queue</h3>
                                <div className={styles.queueButtons}>
                                    <button
                                        className={styles.queueClearButton}
                                        onClick={clearQueue}
                                        disabled={queue.length === 0}
                                    >
                                        <i className="fi fi-rr-trash"></i>
                                    </button>
                                    <button 
                                        className={styles.queueCloseButton} 
                                        onClick={() => setShowQueue(false)}
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                            <div className={styles.queueContent}>
                                {queue.map((dsrcId, index) => (
                                    <div key={dsrcId}>
                                    <QueueItem
                                        dsrcId={dsrcId}
                                        index={index}
                                        playTrack={playTrack}
                                    />
                                    </div>
                                    
                                ))}
                            </div>
                        </div>
                    )}
    
                    <audio
                        ref={audioRef}
                        onTimeUpdate={() => {
                            if (!isTransitioningRef.current && !isSeeking) {
                                setCurrentTime(audioRef.current?.currentTime || 0);
                            }
                        }}
                        onEnded={() => {
                            if (!isTransitioningRef.current && !isSeeking) {
                                handleEndedTransition();
                            }
                        }}
                        onSeeking={() => setIsSeeking(true)}
                        onSeeked={() => {
                            setTimeout(() => setIsSeeking(false), 200);
                        }}
                        onError={(e) => {
                            console.error('Audio playback error:', e);
                            setIsBuffering(false);
                            isTransitioningRef.current = false;
                            setIsSeeking(false);
                        }}
                        onPlaying={() => setIsBuffering(false)}
                        onWaiting={() => setIsBuffering(true)}
                    />
                </div>
            </>
        );
    }
    
    
}