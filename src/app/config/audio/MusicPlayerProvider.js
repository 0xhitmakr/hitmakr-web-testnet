"use client"

import React, { createContext, useContext, useCallback } from 'react';
import { useRecoilState } from 'recoil';
import PlayerStore from '../store/HitmakrPlayerStore';

const MusicPlayerContext = createContext();

export const useMusicPlayer = () => useContext(MusicPlayerContext);

export const MusicPlayerProvider = ({ children }) => {
  const [playerState, setPlayerState] = useRecoilState(PlayerStore.PlayerState);
  
  const { 
    isPlaying = false, 
    currentTrack = null, 
    queue = [], 
    isShuffle = false, 
    isRepeat = false, 
    playHistory = []
  } = playerState || {};

  const playTrack = useCallback((track) => {
    if (!track) return;

    setPlayerState(prev => ({
      ...prev || {}, 
      currentTrack: track,
      isPlaying: true,
      playHistory: prev?.currentTrack 
        ? [...(prev.playHistory || []), prev.currentTrack]
        : []
    }));
  }, [setPlayerState]);

  const addToQueue = useCallback((track) => {
    if (!track) return;

    setPlayerState(prev => {
      const currentQueue = prev?.queue || [];
      if (currentQueue.includes(track)) {
        console.warn('DSRC already added to queue');
        return prev || {};
      }

      const newQueue = isShuffle 
        ? (() => {
            const updatedQueue = [...currentQueue];
            const randomIndex = Math.floor(Math.random() * (updatedQueue.length + 1));
            updatedQueue.splice(randomIndex, 0, track);
            return updatedQueue;
          })()
        : [...currentQueue, track];

      return {
        ...prev || {},
        queue: newQueue
      };
    });
  }, [isShuffle, setPlayerState]);

  const removeFromQueue = useCallback((track) => {
    setPlayerState(prev => {
      const currentQueue = prev?.queue || [];
      const trackCount = currentQueue.filter(t => t === track).length;

      const newQueue = trackCount > 1
        ? (() => {
            const firstIndex = currentQueue.indexOf(track);
            return [...currentQueue.slice(0, firstIndex), ...currentQueue.slice(firstIndex + 1)];
          })()
        : currentQueue.filter(t => t !== track);

      return {
        ...prev || {},
        queue: newQueue
      };
    });
  }, [setPlayerState]);

  const playPause = useCallback(() => {
    setPlayerState(prev => ({
      ...prev || {},
      isPlaying: !(prev?.isPlaying)
    }));
  }, [setPlayerState]);

  const previousTrack = useCallback(() => {
    if (!playHistory?.length) return;

    setPlayerState(prev => {
      if (!prev?.playHistory?.length) return prev || {};

      const prevTrack = prev.playHistory[prev.playHistory.length - 1];
      return {
        ...prev,
        currentTrack: prevTrack,
        playHistory: prev.playHistory.slice(0, -1),
        queue: prev.currentTrack 
          ? [prev.currentTrack, ...(prev.queue || [])]
          : prev.queue || []
      };
    });
  }, [playHistory, setPlayerState]);

  const nextTrack = useCallback(() => {
    if (!currentTrack) return;

    setPlayerState(prev => {
      if (!prev) return {};
      const currentQueue = prev.queue || [];
      
      if (isShuffle) {
        if (currentQueue.length === 0) {
          if (isRepeat) {
            const allTracks = [...(prev.playHistory || []), prev.currentTrack];
            const shuffledTracks = [...allTracks].sort(() => Math.random() - 0.5);
            return {
              ...prev,
              queue: shuffledTracks,
              playHistory: []
            };
          }
          return {
            ...prev,
            isPlaying: false
          };
        }

        const randomIndex = Math.floor(Math.random() * currentQueue.length);
        const nextTrack = currentQueue[randomIndex];
        return {
          ...prev,
          currentTrack: nextTrack,
          queue: currentQueue.filter((_, i) => i !== randomIndex),
          playHistory: prev.currentTrack 
            ? [...(prev.playHistory || []), prev.currentTrack]
            : prev.playHistory || []
        };
      }

      if (currentQueue.length > 0) {
        const [next, ...restQueue] = currentQueue;
        return {
          ...prev,
          currentTrack: next,
          queue: restQueue,
          playHistory: prev.currentTrack 
            ? [...(prev.playHistory || []), prev.currentTrack]
            : prev.playHistory || []
        };
      }

      if (isRepeat) {
        const allTracks = [...(prev.playHistory || []), prev.currentTrack];
        return {
          ...prev,
          currentTrack: allTracks[0],
          queue: allTracks.slice(1),
          playHistory: []
        };
      }

      return {
        ...prev,
        isPlaying: false
      };
    });
  }, [currentTrack, isShuffle, isRepeat, setPlayerState]);

  const toggleShuffle = useCallback(() => {
    setPlayerState(prev => ({
      ...prev || {},
      isShuffle: !(prev?.isShuffle),
      queue: !(prev?.isShuffle)
        ? [...(prev?.queue || [])].sort(() => Math.random() - 0.5)
        : (prev?.queue || [])
    }));
  }, [setPlayerState]);

  const toggleRepeat = useCallback(() => {
    setPlayerState(prev => ({
      ...prev || {},
      isRepeat: !(prev?.isRepeat)
    }));
  }, [setPlayerState]);

  const clearQueue = useCallback(() => {
    setPlayerState(prev => ({
      ...prev || {},
      queue: []
    }));
  }, [setPlayerState]);

  const isTrackIdPlaying = useCallback(
    (trackId) => currentTrack && currentTrack.id === trackId && isPlaying,
    [currentTrack, isPlaying]
  );

  return (
    <MusicPlayerContext.Provider
      value={{
        isPlaying,
        currentTrack,
        queue,
        isShuffle,
        isRepeat,
        playHistory,
        playTrack,
        addToQueue,
        playPause,
        nextTrack,
        previousTrack,
        toggleShuffle,
        toggleRepeat,
        clearQueue,
        isTrackIdPlaying,
        removeFromQueue
      }}
    >
      {children}
    </MusicPlayerContext.Provider>
  );
};

export default MusicPlayerProvider;