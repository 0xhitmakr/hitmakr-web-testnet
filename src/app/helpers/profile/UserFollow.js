"use client"
import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import styles from '../styles/Helpers.module.css';
import LoaderBlackSmall from '@/app/components/animations/loaders/loaderBlackSmall';
import LoaderWhiteSmall from '@/app/components/animations/loaders/loaderWhiteSmall';
import { toast } from 'react-hot-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_HITMAKR_SERVER;

const UserFollow = ({ userAddress }) => {
    const { address, chainId } = useAccount();
    const [isLoading, setIsLoading] = useState(false);
    const [currentlyFollowing, setCurrentlyFollowing] = useState(false);
    const [followerCount, setFollowerCount] = useState(0);

    useEffect(() => {
        if (address && userAddress) {
            fetchFollowStatus();
            fetchFollowerCount();
        }
    }, [address, userAddress]);

    const fetchFollowStatus = async () => {
        try {
            const authToken = localStorage.getItem("authToken");
            if (!authToken || !address) return;

            const response = await fetch(
                `${API_BASE_URL}/follow/follow-status/${userAddress}`,
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
                throw new Error('Failed to fetch follow status');
            }

            const data = await response.json();
            setCurrentlyFollowing(data.isFollowing);
        } catch (error) {
            console.error('Error fetching follow status:', error);
        }
    };

    const fetchFollowerCount = async () => {
        try {
            const authToken = localStorage.getItem("authToken");
            if (!authToken || !userAddress) return;

            const response = await fetch(
                `${API_BASE_URL}/follow/follow-counts/${userAddress}`,
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
                throw new Error('Failed to fetch follower count');
            }

            const data = await response.json();
            setFollowerCount(data.followers);
        } catch (error) {
            console.error('Error fetching follower count:', error);
        }
    };

    const handleFollow = async () => {
        if (!address || !userAddress) return;
        
        setIsLoading(true);
        const authToken = localStorage.getItem("authToken");
        
        if (!authToken) {
            toast.error("Authentication required");
            setIsLoading(false);
            return;
        }

        try {
            const endpoint = currentlyFollowing ? 'unfollow' : 'follow';
            const response = await fetch(`${API_BASE_URL}/follow/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'x-user-address': address,
                    'x-chain-id': chainId?.toString(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    followingAddress: userAddress
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to ${endpoint}`);
            }

            const data = await response.json();
            setCurrentlyFollowing(!currentlyFollowing);
            setFollowerCount(data.counts.followers);
            
            toast.success(data.message);
        } catch (error) {
            console.error('Follow/Unfollow error:', error);
            toast.error(error.message || 'Failed to update follow status');
            // Revert the state in case of error
            setCurrentlyFollowing(currentlyFollowing);
        } finally {
            setIsLoading(false);
        }
    };

    const buttonStyle = {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '5px 10px',
        marginLeft: '10px',
        backgroundColor: currentlyFollowing ? '#252525' : '#fff',
        color: currentlyFollowing ? '#fff' : '#000',
        borderRadius: '100px',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease'
    };

    const hoverStyles = !isLoading && {
        backgroundColor: currentlyFollowing ? '#333' : '#f5f5f5'
    };

    if (!address || address === userAddress) {
        return null; // Don't show follow button for own profile
    }

    return (
        <>
            <div 
                className={styles.profilePageOptionFollow}
                onClick={!isLoading ? handleFollow : undefined}
                style={buttonStyle}
                onMouseOver={(e) => Object.assign(e.currentTarget.style, hoverStyles)}
                onMouseOut={(e) => Object.assign(e.currentTarget.style, buttonStyle)}
            >
                <p style={{ 
                    fontSize: '14px',
                    fontWeight: 'bold',
                    margin: '0'
                }}>
                    {isLoading 
                        ? currentlyFollowing 
                            ? <LoaderWhiteSmall />
                            : <LoaderBlackSmall />
                        : currentlyFollowing 
                            ? "Unfollow" 
                            : "Follow"
                    }
                </p>
            </div>
        </>
    );
};

export default UserFollow;