"use client"

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import styles from "../styles/ProfileReleases.module.css";
import LoaderWhiteSmall from "@/app/components/animations/loaders/loaderWhiteSmall";
import { toast } from 'react-hot-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_HITMAKR_SERVER;

const HeartButton = ({ dsrcId, showModal }) => {
    const { address, chainId } = useAccount();
    const [isAnimating, setIsAnimating] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [hasLiked, setHasLiked] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);

    useEffect(() => {
        const fetchLikeStatus = async () => {
            if (!address || !dsrcId) {
                setIsInitializing(false);
                return;
            }

            try {
                const authToken = localStorage.getItem("authToken");
                if (!authToken) {
                    setIsInitializing(false);
                    return;
                }

                const response = await fetch(
                    `${API_BASE_URL}/heart/status/${dsrcId}`,
                    {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${authToken}`,
                            'x-user-address': address,
                            'x-chain-id': chainId?.toString(),
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (!response.ok) {
                    throw new Error('Failed to fetch like status');
                }

                const data = await response.json();
                setHasLiked(data.hasLiked);
            } catch (error) {
                console.error('Error fetching like status:', error);
            } finally {
                setIsInitializing(false);
            }
        };

        fetchLikeStatus();
    }, [address, dsrcId, chainId]);

    const handleHeartClick = async () => {
        if (!address) {
            showModal({
                show: true,
                title: "Connect Wallet",
                description: "Please connect your wallet to like this DSRC."
            });
            return;
        }

        if (isLoading) return;

        setIsAnimating(true);
        setIsLoading(true);

        try {
            const authToken = localStorage.getItem("authToken");
            if (!authToken) {
                throw new Error("Authentication required");
            }

            const response = await fetch(
                `${API_BASE_URL}/heart/toggle`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'x-user-address': address,
                        'x-chain-id': chainId?.toString(),
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        dsrcId
                    })
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to toggle like');
            }

            const data = await response.json();
            setHasLiked(data.action === 'liked');
            
            toast.success(data.message);
            
        } catch (error) {
            console.error('Heart action error:', error);
            
            showModal({
                show: true,
                title: "Action Failed",
                description: error.message || "Failed to process your request"
            });
        } finally {
            setIsLoading(false);
            setTimeout(() => {
                setIsAnimating(false);
            }, 300);
        }
    };

    const buttonStyle = {
        transform: isAnimating ? 'scale(1.2)' : 'scale(1)',
        transition: 'transform 0.2s ease',
    };

    const iconStyle = {
        color: hasLiked ? '#ff3b5c' : '#888',
        fontSize: '16px',
        transition: 'color 0.2s ease'
    };

    if (isInitializing || isLoading) {
        return (
            <div className={styles.dsrcMetadataLeftOption}>
                <LoaderWhiteSmall />
            </div>
        );
    }

    return (
        <button 
            className={styles.dsrcMetadataLeftOption}
            onClick={handleHeartClick}
            style={buttonStyle}
            disabled={isLoading}
        >
            <i 
                className={`fi ${hasLiked ? 'fi-sr-heart' : 'fi-rr-heart'}`}
                style={iconStyle}
            />
        </button>
    );
};

export default HeartButton;