"use client";
import { useState, useEffect } from 'react';
import { useGetDSRC } from '../hitmakrdsrcfactory/hitmakrDSRCFactoryRPC';
import { useGetDSRCDetails } from './hitmakrDSRCRPC';

export const useDSRCData = (dsrcId) => {
    const [dsrcData, setDsrcData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const { dsrcAddress, isLoading: addressLoading, error: addressError } = useGetDSRC(dsrcId);  
    const { details, loading: detailsLoading, error: detailsError } = useGetDSRCDetails(dsrcAddress); 

    console.log(details)

    useEffect(() => {
        let mounted = true;

        const fetchMetadata = async () => {
            if (!dsrcAddress || addressLoading || detailsLoading || !mounted) return; 

            if (details && details.tokenUri) {
                try {
                    const response = await fetch(details.tokenUri);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const data = await response.json();
                    if (mounted) {
                        setDsrcData(data);
                    }

                } catch (err) {
                    if (mounted) {
                        setError(err);
                        console.error("Error fetching or parsing metadata:", err); 
                    }

                } finally {
                    if (mounted) {
                        setIsLoading(false);
                    }
                }
            } else {
                if(detailsError){
                    if (mounted) {
                        setError(detailsError) 
                        setIsLoading(false)
                    }
                    
                } else {
                    if (mounted) {
                        setError(new Error("Token URI not found in details")); 
                        setIsLoading(false);
                    }
                    
                }

            }
        };

        fetchMetadata();

        return () => {
            mounted = false;
        };
    }, [dsrcId, dsrcAddress, details, addressLoading, detailsLoading, detailsError]); 


    return { data: dsrcData, isLoading, error };
};