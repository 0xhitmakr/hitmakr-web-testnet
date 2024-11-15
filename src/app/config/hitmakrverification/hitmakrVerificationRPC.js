"use client"

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import abi from './abi/abi';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_HITMAKR_VERIFICATION_ADDRESS;
const RPC_URL = process.env.NEXT_PUBLIC_SKALE_TESTNET_RPC_URL;


export const useIsVerifiedRPC = (address) => {
    const [isVerified, setIsVerified] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const checkVerification = async () => {
            try {
                const provider = new ethers.JsonRpcProvider(RPC_URL);
                const contract = new ethers.Contract(
                    CONTRACT_ADDRESS,
                    abi,
                    provider
                );
                const data = await contract.isVerified(address);
                setIsVerified(data);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        if (address) {
            checkVerification();
        }
    }, [address]);

    return { isVerified, loading, error };
};


export const useHitmakrControlCenterRPC = () => {
    const [controlCenterAddress, setControlCenterAddress] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const getControlCenter = async () => {
            try {
                const provider = new ethers.JsonRpcProvider(RPC_URL);
                const contract = new ethers.Contract(
                    CONTRACT_ADDRESS,
                    abi,
                    provider
                );
                const data = await contract.HITMAKR_CONTROL_CENTER();
                setControlCenterAddress(data);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        getControlCenter();
    }, []);

    return { controlCenterAddress, loading, error };
};


export const useHitmakrProfilesRPC = () => {
    const [profilesAddress, setProfilesAddress] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const getProfilesAddress = async () => {
            try {
                const provider = new ethers.JsonRpcProvider(RPC_URL);
                const contract = new ethers.Contract(
                    CONTRACT_ADDRESS,
                    abi,
                    provider
                );
                const data = await contract.HITMAKR_PROFILES();
                setProfilesAddress(data);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        getProfilesAddress();
    }, []);

    return { profilesAddress, loading, error };
};


export const useIsContractPausedRPC = () => {
    const [isPaused, setIsPaused] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const checkPauseStatus = async () => {
            try {
                const provider = new ethers.JsonRpcProvider(RPC_URL);
                const contract = new ethers.Contract(
                    CONTRACT_ADDRESS,
                    abi,
                    provider
                );
                const data = await contract.paused();
                setIsPaused(data);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        checkPauseStatus();
    }, []);

    return { isPaused, loading, error };
};