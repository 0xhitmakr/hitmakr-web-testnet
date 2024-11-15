// GetDSRCData.js (Client Component)
"use client";
import { useState, useEffect } from 'react';
import { useGetDSRC } from '../hitmakrdsrcfactory/hitmakrDSRCFactoryRPC';
import { useGetDSRCDetails } from '../hitmakrdsrc/hitmakrDSRCRPC';

export const GetDSRCData = (dsrcid) => { 
  const [dsrcData, setDsrcData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const { dsrcAddress, isLoading: addressLoading } = useGetDSRC(dsrcid);
  const { details, loading: detailsLoading } = useGetDSRCDetails(dsrcAddress);

  useEffect(() => {
    let mounted = true;

    const fetchMetadata = async () => {
      if (!details || detailsLoading || addressLoading || !mounted) return; 

      if (details?.tokenUri) {
        try {
          const response = await fetch(details.tokenUri);
          if (!response.ok) {
            throw new Error(
              `Failed to fetch metadata: ${response.status} ${response.statusText}`
            );
          }
          const data = await response.json();
          if (mounted) {
            setDsrcData(data);
          }
        } catch (error) {
          console.error("Error fetching metadata:", error);
          if (mounted) {
            setError(error.message);
          }
        } finally {
          if (mounted) {
            setIsLoading(false);
          }
        }
      } else if (!details?.tokenUri && mounted) {
        if (mounted) {
          setIsLoading(false);
          setError("Token URI not found");
        }
      }
    };

    fetchMetadata();

    return () => {
      mounted = false;
    };
  }, [details, detailsLoading, addressLoading, dsrcid]);


  return { data: dsrcData, loading: isLoading, error }; 
};
