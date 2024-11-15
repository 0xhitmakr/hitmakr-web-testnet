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
  key: 'HitmakrCreativesStore',
  storage: getStorage(),
  converter: JSON,
});


const HitmakrCreatives = atom({
  key: 'HitmakrCreatives',
  default: {
    rcaId: null,
    countryCode: null,
    isRegistered: null,
    isRegistering: null,
  },
  effects_UNSTABLE: [persistAtom],
});


const HitmakrVerificationForm = atom({
  key: 'HitmakrVerificationForm',
  default: {
    formType: 'artist',
    formData: {},
    existingData: null,
    isLoading: true,
    isEditing: false,
    isSubmitting: false,
    canUpdate: false,
    remainingTime: 0,
  }
});


const CreativesUpload = atom({
  key: 'CreativesUpload',
  default: {
    selectedFile: null,
    selectedCover: null,
    songDetails: {
      title: "",
      description: "",
      genre: "",
      license: "",
      country: "",
      language: "",
      lyrics: "",
    },
    subscribersUpload: false,
    selectedCategory: "music",
    selectedLyrics: null,
    royaltySplits: [],
    newAddress: '',
    copyrightChecked: false,
    copyrightOverwrite: false,
    mintPrice: 5,
    selectedChain: 'SKL',
  },
});


const HitmakrMySpotify = atom({
  key: 'HitmakrMySpotify',
  default: {
    spotifyData: null,
    spotifyDataLoading: false,
    spotifyDataError: null,
  },
});


const HitmakrCreativesRegister = atom({
  key: 'HitmakrCreativesRegister',
  default: {
    registerRcaId: "",
    registerCountryCode: "",
    isRegisterLoading: false,
    rcaIdStatus: false,
  },
});


const HitmakrCreativesMetaStates = atom({
  key: 'HitmakrCreativesMetaStates',
  default: {
    sidebar: false,
  },
});


const NewCreativeUpload = atom({
  key: 'NewCreativeUpload',
  default: {
    newUpload: false,
    tokenURI: "",
    initialPrice: 0, 
    royaltySplits: [], 
    isGated: false,
  },
});


const HitmakrCreativesStore = {
  HitmakrCreatives,
  HitmakrCreativesRegister,
  HitmakrCreativesMetaStates,
  HitmakrVerificationForm,
  HitmakrMySpotify,
  CreativesUpload,
  NewCreativeUpload,
};

export default HitmakrCreativesStore;
