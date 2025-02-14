"use client"

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAccount } from 'wagmi';
import { useAuth } from "@campnetwork/sdk/react";

const CampAuthContext = createContext({
  linkedSocials: null,
  isLoadingSocials: false,
  refetchSocials: async () => {},
});

export const useCampAuth = () => {
  const context = useContext(CampAuthContext);
  if (!context) {
    throw new Error('useCampAuth must be used within a CampAuthProvider');
  }
  return context;
};

export const CampAuthProvider = ({ children }) => {
  const [linkedSocials, setLinkedSocials] = useState(null);
  const [isLoadingSocials, setIsLoadingSocials] = useState(false);
  
  const { isConnected } = useAccount();
  const auth = useAuth();
  
  const fetchingRef = useRef(false);

  const fetchSocials = useCallback(async () => {
    if (fetchingRef.current || !auth || !isConnected) return;
    
    try {
      fetchingRef.current = true;
      setIsLoadingSocials(true);
      
      const socials = await auth.getLinkedSocials();
      setLinkedSocials(socials);
    } catch (error) {
      console.error('Error fetching socials:', error);
      setLinkedSocials(null);
    } finally {
      setIsLoadingSocials(false);
      fetchingRef.current = false;
    }
  }, [auth, isConnected]);

  useEffect(() => {
    if (!isConnected) {
      setLinkedSocials(null);
      return;
    }

    fetchSocials();
  }, [isConnected, fetchSocials]);

  // URL parameter check
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    if (params.has('social') && isConnected && !fetchingRef.current) {
      fetchSocials();
    }
  }, [isConnected, fetchSocials]);

  const value = {
    linkedSocials,
    isLoadingSocials,
    refetchSocials: fetchSocials,
  };

  return (
    <CampAuthContext.Provider value={value}>
      {children}
    </CampAuthContext.Provider>
  );
};

export default CampAuthProvider;