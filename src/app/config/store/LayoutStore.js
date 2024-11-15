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
  key: 'HitmakrLayoutStore', 
  storage: getStorage(),
  converter: JSON,
});


const LayoutMetadata = atom({
  key: 'LayoutMetadata',
  default: {
    isProfileBarActive: false,
    isLibraryBarActive: false,
    searchInput: "",
  },
});


const LayoutStore = {
  LayoutMetadata,
};

export default LayoutStore;