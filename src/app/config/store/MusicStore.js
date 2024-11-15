"use client"

import { atom } from 'recoil';
import { recoilPersist } from 'recoil-persist';
import { useGetDSRC } from '../hitmakrdsrcfactory/hitmakrDSRCFactoryRPC';
import { useGetDSRCDetails } from '../hitmakrdsrc/hitmakrDSRCRPC';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { useState, useEffect, useMemo, useCallback } from 'react';

const { persistAtom } = recoilPersist({
    key: 'HitmakrMusicStore',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
});

class AudioChunkStreamManager {
    constructor() {
        this.audioContext = typeof window !== 'undefined' ? new (window.AudioContext || window.webkitAudioContext)() : null;
        this.sourceNode = null;
        this.gainNode = null;
        this.buffers = new Map();
        this.currentTime = 0;
        this.isPlaying = false;
        this.chunks = [];
        this.currentChunkIndex = 0;
        this.onEndCallback = null;
        this.onTimeUpdate = null;
        this.onBuffering = null;
        this.onError = null;
        this.startTime = 0;
        this.totalDuration = 0;
        this.setupAudioNodes();
    }

    setupAudioNodes() {
        if (this.audioContext) {
            this.gainNode = this.audioContext.createGain();
            this.gainNode.connect(this.audioContext.destination);
        }
    }

    async loadChunks(chunkUrls) {
        try {
            if (this.onBuffering) this.onBuffering(true);
            
            this.chunks = chunkUrls.map(url => `https://gateway.irys.xyz/${url}`);
            this.currentChunkIndex = 0;
            this.buffers.clear();
            this.totalDuration = 0;
            
            // Preload first two chunks
            await Promise.all([
                this.loadChunk(0),
                this.loadChunk(1)
            ]);

            if (this.onBuffering) this.onBuffering(false);
        } catch (error) {
            console.error('Error loading chunks:', error);
            if (this.onError) this.onError(error);
            if (this.onBuffering) this.onBuffering(false);
        }
    }

    async loadChunk(index) {
        if (index >= this.chunks.length || this.buffers.has(index)) return;

        try {
            const response = await fetch(this.chunks[index]);
            if (!response.ok) throw new Error('Failed to fetch chunk');
            
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.buffers.set(index, audioBuffer);
            this.totalDuration += audioBuffer.duration;
            
            return audioBuffer;
        } catch (error) {
            console.error(`Error loading chunk ${index}:`, error);
            if (this.onError) this.onError(error);
        }
    }

    async play() {
        if (!this.audioContext || !this.buffers.has(this.currentChunkIndex)) return;

        try {
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            this.isPlaying = true;
            this.startTime = this.audioContext.currentTime - this.currentTime;
            this.playNextChunk();

            // Start time tracking
            this.startTimeTracking();
        } catch (error) {
            console.error('Error playing audio:', error);
            if (this.onError) this.onError(error);
        }
    }

    startTimeTracking() {
        const updateTime = () => {
            if (this.isPlaying) {
                this.currentTime = this.audioContext.currentTime - this.startTime;
                if (this.onTimeUpdate) this.onTimeUpdate(this.currentTime);
                requestAnimationFrame(updateTime);
            }
        };
        requestAnimationFrame(updateTime);
    }

    async playNextChunk() {
        if (!this.isPlaying || !this.buffers.has(this.currentChunkIndex)) return;

        try {
            const buffer = this.buffers.get(this.currentChunkIndex);
            this.sourceNode = this.audioContext.createBufferSource();
            this.sourceNode.buffer = buffer;
            this.sourceNode.connect(this.gainNode);

            this.sourceNode.onended = async () => {
                this.currentChunkIndex++;
                if (this.currentChunkIndex < this.chunks.length) {
                    await this.playNextChunk();
                    // Preload next chunk if available
                    this.loadChunk(this.currentChunkIndex + 1);
                } else {
                    this.isPlaying = false;
                    this.currentChunkIndex = 0;
                    this.currentTime = 0;
                    if (this.onEndCallback) this.onEndCallback();
                }
            };

            const offset = this.currentChunkIndex === 0 ? this.currentTime : 0;
            this.sourceNode.start(0, offset);
        } catch (error) {
            console.error('Error playing chunk:', error);
            if (this.onError) this.onError(error);
        }
    }

    pause() {
        if (this.audioContext) {
            this.audioContext.suspend();
            this.isPlaying = false;
        }
    }

    stop() {
        if (this.sourceNode) {
            this.sourceNode.stop();
            this.sourceNode.disconnect();
        }
        this.currentChunkIndex = 0;
        this.currentTime = 0;
        this.isPlaying = false;
        if (this.onTimeUpdate) this.onTimeUpdate(0);
    }

    seek(time) {
        if (!this.audioContext || !this.buffers.size) return;

        let accumulatedDuration = 0;
        let targetChunk = 0;
        let chunkOffset = time;

        // Find target chunk and offset
        for (let i = 0; i < this.buffers.size; i++) {
            const buffer = this.buffers.get(i);
            if (!buffer) continue;

            if (accumulatedDuration + buffer.duration > time) {
                targetChunk = i;
                chunkOffset = time - accumulatedDuration;
                break;
            }
            accumulatedDuration += buffer.duration;
        }

        // Stop current playback
        if (this.sourceNode) {
            this.sourceNode.stop();
            this.sourceNode.disconnect();
        }

        this.currentChunkIndex = targetChunk;
        this.currentTime = time;
        this.startTime = this.audioContext.currentTime - time;

        if (this.isPlaying) {
            this.playNextChunk();
        }
    }

    setVolume(value) {
        if (this.gainNode) {
            this.gainNode.gain.value = value;
        }
    }

    getBufferedTime() {
        let bufferedDuration = 0;
        for (let i = 0; i < this.currentChunkIndex; i++) {
            const buffer = this.buffers.get(i);
            if (buffer) bufferedDuration += buffer.duration;
        }
        return bufferedDuration;
    }

    setOnEndCallback(callback) {
        this.onEndCallback = callback;
    }
}

const PlayerState = atom({
    key: 'PlayerState',
    default: {
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        volume: 1,
        isMuted: false,
        previousVolume: 1,
        isBuffering: false,
    },
    effects_UNSTABLE: [persistAtom],
});

const QueueState = atom({
    key: 'QueueState',
    default: {
        currentQueue: [],
        queueIndex: 0,
        history: [],
        currentDSRCId: null,
    },
    effects_UNSTABLE: [persistAtom],
});

const PlayerControls = atom({
    key: 'PlayerControls',
    default: {
        repeat: 'off', // 'off', 'track', 'queue'
        shuffle: false,
    },
    effects_UNSTABLE: [persistAtom],
});

function useDSRCMetadata(dsrcId) {
    const [metadata, setMetadata] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchMetadata = useCallback(async () => {
        if (!dsrcId) return;
        
        setLoading(true);
        try {
            const { dsrcAddress } = await useGetDSRC(dsrcId);
            const { details } = await useGetDSRCDetails(dsrcAddress);
            
            if (details?.tokenUri) {
                const response = await fetch(details.tokenUri);
                if (!response.ok) throw new Error('Failed to fetch metadata');
                const data = await response.json();
                
                const transformedData = {
                    ...data,
                    audioChunks: data.audio.map(chunk => chunk),
                    duration: data.attributes.find(attr => attr.trait_type === 'Duration')?.value || '0:00',
                };
                
                setMetadata(transformedData);
            }
        } catch (error) {
            console.error("Error fetching metadata:", error);
            setMetadata(null);
        } finally {
            setLoading(false);
        }
    }, [dsrcId]);

    useEffect(() => {
        fetchMetadata();
    }, [fetchMetadata]);

    return { metadata, loading };
}

function useQueueManager() {
    const [queueState, setQueueState] = useRecoilState(QueueState);
    const [playerState, setPlayerState] = useRecoilState(PlayerState);
    const [controls, setControls] = useRecoilState(PlayerControls);
    const audioManager = useMemo(() => new AudioChunkStreamManager(), []);
    const [currentMetadata, setCurrentMetadata] = useState(null);

    const fetchMetadata = async (dsrcId) => {
        try {
            const { dsrcAddress } = await useGetDSRC(dsrcId);
            const { details } = await useGetDSRCDetails(dsrcAddress);
            
            if (details?.tokenUri) {
                const response = await fetch(details.tokenUri);
                if (!response.ok) throw new Error('Failed to fetch metadata');
                const data = await response.json();
                
                return {
                    ...data,
                    audioChunks: data.audio.map(chunk => chunk),
                    duration: data.attributes.find(attr => attr.trait_type === 'Duration')?.value || '0:00',
                };
            }
        } catch (error) {
            console.error("Error fetching metadata:", error);
            return null;
        }
    };

    const playDSRC = async (dsrcId) => {
        try {
            setPlayerState(curr => ({ ...curr, isBuffering: true }));
            const metadata = await fetchMetadata(dsrcId);
            
            if (!metadata?.audioChunks?.length) {
                throw new Error('No audio chunks found');
            }

            setCurrentMetadata(metadata);
            await audioManager.loadChunks(metadata.audioChunks);
            await audioManager.play();
            
            setPlayerState(curr => ({
                ...curr,
                isPlaying: true,
                duration: metadata.duration,
                isBuffering: false
            }));
        } catch (error) {
            console.error('Error playing DSRC:', error);
            setPlayerState(curr => ({
                ...curr,
                isPlaying: false,
                isBuffering: false
            }));
        }
    };

    const addToQueue = async (dsrcId, position = 'end') => {
        try {
            setPlayerState(curr => ({ ...curr, isBuffering: true }));
            const metadata = await fetchMetadata(dsrcId);
            
            if (!metadata) {
                throw new Error('Failed to fetch metadata');
            }

            setQueueState(curr => {
                let newQueue = [...curr.currentQueue];
                
                switch (position) {
                    case 'next':
                        newQueue.splice(curr.queueIndex + 1, 0, dsrcId);
                        break;
                    case 'start':
                        newQueue.unshift(dsrcId);
                        return {
                            ...curr,
                            currentQueue: newQueue,
                            queueIndex: 0,
                            currentDSRCId: dsrcId
                        };
                    default: // 'end'
                        newQueue.push(dsrcId);
                }
                
                return {
                    ...curr,
                    currentQueue: newQueue,
                    currentDSRCId: curr.currentQueue.length === 0 ? dsrcId : curr.currentDSRCId
                };
            });

            setPlayerState(curr => ({ ...curr, isBuffering: false }));
        } catch (error) {
            console.error('Error adding to queue:', error);
            setPlayerState(curr => ({ ...curr, isBuffering: false }));
        }
    };

    const playImmediately = async (dsrcId) => {
        try {
            setPlayerState(curr => ({ ...curr, isBuffering: true }));
            await addToQueue(dsrcId, 'start');
            await playDSRC(dsrcId);
        } catch (error) {
            console.error('Error playing immediately:', error);
            setPlayerState(curr => ({ ...curr, isBuffering: false }));
        }
    };

    const skipNext = async () => {
        setQueueState(curr => {
            let nextIndex = curr.queueIndex;
            let nextQueue = [...curr.currentQueue];

            if (controls.shuffle) {
                const remainingTracks = nextQueue.slice(curr.queueIndex + 1);
                if (remainingTracks.length > 0) {
                    const randomIndex = Math.floor(Math.random() * remainingTracks.length);
                    const trackToPlay = remainingTracks[randomIndex];
                    
                    nextQueue = nextQueue.filter(id => id !== trackToPlay);
                    nextQueue.splice(curr.queueIndex + 1,0, trackToPlay);
                    nextIndex = curr.queueIndex + 1;
                } else if (controls.repeat === 'queue') {
                    const currentTrack = nextQueue[curr.queueIndex];
                    nextQueue = nextQueue.filter((_, i) => i !== curr.queueIndex);
                    for (let i = nextQueue.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [nextQueue[i], nextQueue[j]] = [nextQueue[j], nextQueue[i]];
                    }
                    nextQueue.unshift(currentTrack);
                    nextIndex = 0;
                }
            } else {
                nextIndex = curr.queueIndex + 1;
                
                if (nextIndex >= nextQueue.length) {
                    if (controls.repeat === 'track') {
                        nextIndex = curr.queueIndex;
                    } else if (controls.repeat === 'queue') {
                        nextIndex = 0;
                    } else {
                        audioManager.stop();
                        setPlayerState(state => ({ ...state, isPlaying: false }));
                        return curr;
                    }
                }
            }

            const nextDSRCId = nextQueue[nextIndex];
            playDSRC(nextDSRCId);

            return {
                ...curr,
                queueIndex: nextIndex,
                currentQueue: nextQueue,
                currentDSRCId: nextDSRCId,
                history: [...curr.history, curr.currentQueue[curr.queueIndex]]
            };
        });
    };

    const skipPrevious = async () => {
        if (playerState.currentTime > 3) {
            audioManager.stop();
            const currentDSRCId = queueState.currentQueue[queueState.queueIndex];
            await playDSRC(currentDSRCId);
            return;
        }

        setQueueState(curr => {
            let prevIndex = curr.queueIndex - 1;
            
            if (prevIndex < 0) {
                if (controls.repeat === 'track') {
                    prevIndex = curr.queueIndex;
                } else if (controls.repeat === 'queue') {
                    prevIndex = curr.currentQueue.length - 1;
                } else {
                    prevIndex = 0;
                }
            }

            const prevDSRCId = curr.currentQueue[prevIndex];
            playDSRC(prevDSRCId);

            return {
                ...curr,
                queueIndex: prevIndex,
                currentDSRCId: prevDSRCId
            };
        });
    };

    const removeFromQueue = (dsrcId) => {
        setQueueState(curr => {
            const index = curr.currentQueue.indexOf(dsrcId);
            if (index === -1) return curr;

            const newQueue = curr.currentQueue.filter(id => id !== dsrcId);
            let newIndex = curr.queueIndex;

            if (index < curr.queueIndex) {
                newIndex = Math.max(0, newIndex - 1);
            } else if (index === curr.queueIndex) {
                audioManager.stop();
                newIndex = Math.min(newIndex, newQueue.length - 1);
                // Play next track if available
                if (newQueue[newIndex]) {
                    playDSRC(newQueue[newIndex]);
                }
            }

            return {
                ...curr,
                currentQueue: newQueue,
                queueIndex: newIndex,
                currentDSRCId: newQueue[newIndex] || null
            };
        });
    };

    const clearQueue = () => {
        audioManager.stop();
        setQueueState({
            currentQueue: [],
            queueIndex: 0,
            history: [],
            currentDSRCId: null
        });
        setPlayerState(curr => ({
            ...curr,
            isPlaying: false,
            currentTime: 0,
            duration: 0
        }));
    };

    const shuffleQueue = () => {
        setQueueState(curr => {
            const currentTrack = curr.currentQueue[curr.queueIndex];
            let remainingTracks = curr.currentQueue.filter((_, i) => i !== curr.queueIndex);
            
            for (let i = remainingTracks.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [remainingTracks[i], remainingTracks[j]] = [remainingTracks[j], remainingTracks[i]];
            }

            return {
                ...curr,
                currentQueue: [currentTrack, ...remainingTracks],
                queueIndex: 0,
                currentDSRCId: currentTrack
            };
        });
    };

    const reorderQueue = (fromIndex, toIndex) => {
        setQueueState(curr => {
            const newQueue = [...curr.currentQueue];
            const [movedItem] = newQueue.splice(fromIndex, 1);
            newQueue.splice(toIndex, 0, movedItem);

            let newQueueIndex = curr.queueIndex;
            if (fromIndex === curr.queueIndex) {
                newQueueIndex = toIndex;
            } else if (
                fromIndex < curr.queueIndex && toIndex >= curr.queueIndex ||
                fromIndex > curr.queueIndex && toIndex <= curr.queueIndex
            ) {
                newQueueIndex = curr.queueIndex + (fromIndex < toIndex ? -1 : 1);
            }

            return {
                ...curr,
                currentQueue: newQueue,
                queueIndex: newQueueIndex
            };
        });
    };

    useEffect(() => {
        if (queueState.currentDSRCId && !playerState.isPlaying && !playerState.isBuffering) {
            playDSRC(queueState.currentDSRCId);
        }

        return () => {
            audioManager.stop();
        };
    }, [queueState.currentDSRCId]);

    useEffect(() => {
        const setupAudioManager = () => {
            audioManager.onTimeUpdate = (time) => {
                setPlayerState(curr => ({ ...curr, currentTime: time }));
            };

            audioManager.onBuffering = (isBuffering) => {
                setPlayerState(curr => ({ ...curr, isBuffering }));
            };

            audioManager.onError = (error) => {
                console.error('Audio error:', error);
                setPlayerState(curr => ({
                    ...curr,
                    isPlaying: false,
                    isBuffering: false
                }));
            };

            audioManager.setOnEndCallback(() => {
                if (controls.repeat === 'track') {
                    playDSRC(queueState.currentDSRCId);
                } else {
                    skipNext();
                }
            });
        };

        setupAudioManager();
    }, [controls.repeat, queueState.currentDSRCId]);

    return {
        addToQueue,
        removeFromQueue,
        clearQueue,
        skipNext,
        skipPrevious,
        shuffleQueue,
        playImmediately,
        reorderQueue,
        queueState,
        currentMetadata,
        audioManager
    };
}

const MusicStore = {
    PlayerState,
    QueueState,
    PlayerControls,
    useDSRCMetadata,
    useQueueManager,
    AudioChunkStreamManager
};

export default MusicStore;