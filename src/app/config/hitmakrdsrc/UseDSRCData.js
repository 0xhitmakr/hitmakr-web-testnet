"use client";
import { useState, useEffect } from 'react';
import { useGetDSRC } from '../hitmakrdsrcfactory/hitmakrDSRCFactoryRPC';
import { useGetDSRCDetails } from './useDSRCRPC'; // Make sure to point to the correct updated hook file

// Edition enum to match contract
const Edition = {
    Streaming: 0,
    Collectors: 1,
    Licensing: 2
};

export const useDSRCData = (dsrcId) => {
    const [dsrcData, setDsrcData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Get DSRC address from factory
    const {
        dsrcAddress,
        isLoading: addressLoading,
        error: addressError
    } = useGetDSRC(dsrcId);

    // Get DSRC details including editions
    const {
        details,
        loading: detailsLoading,
        error: detailsError
    } = useGetDSRCDetails(dsrcAddress);

    useEffect(() => {
        let mounted = true;

        const fetchMetadata = async () => {
            if (!dsrcAddress || addressLoading || detailsLoading || !mounted) return;

            if (addressError) {
                if (mounted) {
                    setError(addressError);
                    setIsLoading(false);
                }
                return;
            }

            if (details && details.tokenUri) {
                try {
                    const response = await fetch(details.tokenUri);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const metadata = await response.json();

                    // Combine metadata with contract details
                    if (mounted) {
                        setDsrcData({
                            metadata,
                            contractData: {
                                dsrcId: details.dsrcId,
                                creator: details.creator,
                                paymentToken: details.paymentToken,
                                selectedChain: details.selectedChain,
                                totalSupply: details.totalSupply,
                                earnings: details.earnings,
                                editions: {
                                    streaming: details.editions?.streaming || {
                                        price: "0",
                                        isEnabled: true,
                                        isCreated: true
                                    },
                                    collectors: details.editions?.collectors || {
                                        price: "0",
                                        isEnabled: false,
                                        isCreated: false
                                    },
                                    licensing: details.editions?.licensing || {
                                        price: "0",
                                        isEnabled: false,
                                        isCreated: false
                                    }
                                }
                            }
                        });
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
                if (detailsError) {
                    if (mounted) {
                        setError(detailsError);
                        setIsLoading(false);
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
    }, [
        dsrcId,
        dsrcAddress,
        details,
        addressLoading,
        detailsLoading,
        detailsError,
        addressError
    ]);

    // Helper to check if an edition is available for purchase
    const isEditionAvailable = (edition) => {
        if (!dsrcData?.contractData?.editions) return false;
        const editionConfig = dsrcData.contractData.editions[edition.toLowerCase()];
        return editionConfig?.isCreated && editionConfig?.isEnabled;
    };

    // Helper to get price for a specific edition
    const getEditionPrice = (edition) => {
        if (!dsrcData?.contractData?.editions) return "0";
        return dsrcData.contractData.editions[edition.toLowerCase()]?.price || "0";
    };

    return {
        data: dsrcData,
        isLoading,
        error,
        isEditionAvailable,
        getEditionPrice
    };
};

export { Edition };