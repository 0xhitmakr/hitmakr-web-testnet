"use client"

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import abi from './abi/abi';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_HITMAKR_PROFILE_DETAILS_ADDRESS;
const RPC_URL = process.env.NEXT_PUBLIC_SKALE_TESTNET_RPC_URL;


export const useProfileDetailsRPC = (address) => {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const provider = new ethers.JsonRpcProvider(RPC_URL);
                const contract = new ethers.Contract(
                    CONTRACT_ADDRESS,
                    abi,
                    provider
                );
                const data = await contract.getProfileDetails(address);
                setDetails({
                    fullName: data[0],
                    imageURI: data[1],
                    bio: data[2],
                    dateOfBirth: Number(data[3]),
                    country: data[4],
                    lastUpdated: Number(data[5]),
                    initialized: data[6]
                });
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        if (address) {
            fetchDetails();
        }
    }, [address]);

    return { details, loading, error };
};


export const useCompleteProfileRPC = (address) => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const provider = new ethers.JsonRpcProvider(RPC_URL);
                const contract = new ethers.Contract(
                    CONTRACT_ADDRESS,
                    abi,
                    provider
                );
                const data = await contract.getCompleteProfile(address);
                setProfile({
                    username: data[0],
                    fullName: data[1],
                    imageURI: data[2],
                    bio: data[3],
                    dateOfBirth: Number(data[4]),
                    country: data[5],
                    lastUpdated: Number(data[6]),
                    initialized: data[7]
                });
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        if (address) {
            fetchProfile();
        }
    }, [address]);

    return { profile, loading, error };
};


export const useHasProfileDetailsRPC = (address) => {
    const [hasDetails, setHasDetails] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const checkDetails = async () => {
            try {
                const provider = new ethers.JsonRpcProvider(RPC_URL);
                const contract = new ethers.Contract(
                    CONTRACT_ADDRESS,
                    abi,
                    provider
                );
                const data = await contract.hasProfileDetails(address);
                setHasDetails(data);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        if (address) {
            checkDetails();
        }
    }, [address]);

    return { hasDetails, loading, error };
};


export const useDetailsCountRPC = () => {
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCount = async () => {
            try {
                const provider = new ethers.JsonRpcProvider(RPC_URL);
                const contract = new ethers.Contract(
                    CONTRACT_ADDRESS,
                    abi,
                    provider
                );
                const data = await contract.getDetailsCount();
                setCount(Number(data));
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchCount();
    }, []);

    return { count, loading, error };
};