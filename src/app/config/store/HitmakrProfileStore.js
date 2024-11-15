"use client"

import { atom } from 'recoil';
import { recoilPersist } from 'recoil-persist';


function getStorage() {
  if (typeof window !== 'undefined') {
    return window.localStorage; 
  }
  return undefined;
}

const { persistAtom } = recoilPersist({
  key: 'HitmakrProfileStore',
  storage: getStorage(),
  converter: JSON,
});


const HitmakrProfile = atom({
  key: 'HitmakrProfile',
  default: {
    name: null,
    isHitmakrUser: null,
    profilePictureUrl: null, 
    fullName: "", 
    bio: "",
  },
  effects_UNSTABLE: [persistAtom],
});

const HitmakrProfileMint = atom({
    key: 'HitmakrProfileMint',
    default: {
        mintName: "",
        mintNameStatus: false,
        isMintLoading: false,
    },
});


const HitmakrProfileStore = {
    HitmakrProfile,
    HitmakrProfileMint
};

export default HitmakrProfileStore;
