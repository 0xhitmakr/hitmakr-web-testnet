"use client"

import { atom } from 'recoil';
import { recoilPersist } from 'recoil-persist';


function getStorage() {
    if (typeof window !== 'undefined') {
        return window.localStorage;
    }
    return undefined;
}

const defaultPlayerState = {
    isPlaying: false,
    queue: [],
    currentTrack: null,
    isShuffle: false,
    isRepeat: false,
    playHistory: [],
};

const { persistAtom } = recoilPersist({
    key: 'PlayerStore',
    storage: getStorage(),
    converter: JSON,
    validator: (state) => {
        if (!state || typeof state !== 'object') return defaultPlayerState;
        
        const isValid = 
            'isPlaying' in state && typeof state.isPlaying === 'boolean' &&
            'queue' in state && Array.isArray(state.queue) &&
            'currentTrack' in state &&
            'isShuffle' in state && typeof state.isShuffle === 'boolean' &&
            'isRepeat' in state && typeof state.isRepeat === 'boolean' &&
            'playHistory' in state && Array.isArray(state.playHistory);

        return isValid ? state : defaultPlayerState;
    }
});


const PlayerState = atom({
    key: 'PlayerState',
    default: defaultPlayerState,
    effects_UNSTABLE: [persistAtom],
});


const PlayerStore = {
    PlayerState,
};

export default PlayerStore;