// HitmakrQueueStore.js
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
    key: 'HitmakrQueueStore',
    storage: getStorage(),
    converter: JSON,
});



const QueueState = atom({
    key: 'queueState',
    default: {
        currentQueue: [], 
        queueIndex: 0, 
        previousQueue: []

    },
    effects_UNSTABLE: [persistAtom],

});


const QueueStore = {
    QueueState,
};

export default QueueStore;