// HitmakrPlayerStore.js
"use client";
import { atom } from 'recoil';
import { recoilPersist } from 'recoil-persist';


function getStorage() {
    if (typeof window !== 'undefined') {
      return window.localStorage;
    }
    return undefined;
  }

const { persistAtom } = recoilPersist({
    key: 'HitmakrPlayerStore', 
    storage: getStorage(),
    converter: JSON,
  });
  


const PlayerState = atom({
    key: 'playerState', 
    default: {
        isPlaying: false,
        currentTime: 0,
        volume: 1,
        isMuted: false,
        previousVolume: 1,
        currentDsrcId: null,
    },
    effects_UNSTABLE: [persistAtom],

});



const PlayerControls = atom({
    key: 'playerControls',
    default: {
        shuffle: false,
        repeat: 'off', 
    },
    effects_UNSTABLE: [persistAtom],

});

const PlayerStore = {
    PlayerState,
    PlayerControls,
};


export default PlayerStore;