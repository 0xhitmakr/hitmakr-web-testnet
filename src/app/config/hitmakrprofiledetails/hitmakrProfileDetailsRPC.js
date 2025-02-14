"use client";

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import abi from './abi/abi';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_HITMAKR_PROFILE_DETAILS_ADDRESS;
const RPC_URL = process.env.NEXT_PUBLIC_SKALE_TESTNET_RPC_URL;

export const useProfileDetailsRPC = (address, signer = null) => {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updating, setUpdating] = useState(false);

    const fetchDetails = useCallback(async () => {
        if (!address) {
            setLoading(false);
            return;
        }

        try {
            const provider = new ethers.JsonRpcProvider(RPC_URL);
            const contract = new ethers.Contract(
                CONTRACT_ADDRESS,
                abi,
                provider
            );
            const data = await contract.profileDetails(address);
            
            setDetails({
                fullName: data.fullName,
                imageURI: data.imageURI,
                bio: data.bio,
                dateOfBirth: Number(data.dateOfBirth),
                country: data.country,
                lastUpdated: Number(data.lastUpdated),
                initialized: data.initialized
            });
            setError(null);
        } catch (err) {
            console.error("Error fetching profile details:", err);
            setError(err);
            setDetails(null);
        } finally {
            setLoading(false);
        }
    }, [address]);

    const setProfileDetails = async (fullName, imageURI, bio, dateOfBirth, country) => {
        if (!signer) {
            throw new Error("Signer is required for this operation");
        }

        setUpdating(true);
        try {
            const contract = new ethers.Contract(
                CONTRACT_ADDRESS,
                abi,
                signer
            );

            const tx = await contract.setProfileDetails(
                fullName,
                imageURI,
                bio,
                dateOfBirth,
                country
            );
            await tx.wait();
            
            // Refresh the details after successful update
            await fetchDetails();
            setError(null);
            return true;
        } catch (err) {
            console.error("Error setting profile details:", err);
            setError(err);
            return false;
        } finally {
            setUpdating(false);
        }
    };

    const updateProfileDetails = async (fullName = "", imageURI = "", bio = "", country = "") => {
        if (!signer) {
            throw new Error("Signer is required for this operation");
        }

        setUpdating(true);
        try {
            const contract = new ethers.Contract(
                CONTRACT_ADDRESS,
                abi,
                signer
            );

            const tx = await contract.updateProfileDetails(
                fullName,
                imageURI,
                bio,
                country
            );
            await tx.wait();
            
            // Refresh the details after successful update
            await fetchDetails();
            setError(null);
            return true;
        } catch (err) {
            console.error("Error updating profile details:", err);
            setError(err);
            return false;
        } finally {
            setUpdating(false);
        }
    };

    useEffect(() => {
        fetchDetails();
    }, [address, fetchDetails]);

    return {
        details,
        loading,
        error,
        updating,
        setProfileDetails,
        updateProfileDetails,
        refetch: fetchDetails
    };
};

export const useDetailsCount = () => {
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchCount = async () => {
        try {
            const provider = new ethers.JsonRpcProvider(RPC_URL);
            const contract = new ethers.Contract(
                CONTRACT_ADDRESS,
                abi,
                provider
            );
            const data = await contract.detailsCount();
            setCount(Number(data));
            setError(null);
        } catch (err) {
            console.error("Error fetching details count:", err);
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCount();
    }, []);

    return {
        count,
        loading,
        error,
        refetch: fetchCount
    };
};