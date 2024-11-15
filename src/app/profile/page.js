"use client"

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import styles from "./styles/Profile.module.css";
import dynamic from "next/dynamic";
const TrianglifyPattern = dynamic(() => import('../components/bgs/TrianglifyPattern'), {
    ssr: false,
  });
import { useAccount } from "wagmi";
import GetDpByAddress from "../helpers/profile/GetDpByAddress";
import GetUsernameByAddress from "../helpers/profile/GetUsernameByAddress";
import { useHasCreativeIDRPC } from "../config/hitmakrcreativeid/hitmakrCreativeIDRPC";
import { useProfileDetailsRPC } from "../config/hitmakrprofiledetails/hitmakrProfileDetailsRPC";
import ProfileAbout from "./components/about/ProfileAbout";
import ProfileReleases from "./components/releases/ProfileReleases";
import LoaderWhiteSmall from "../components/animations/loaders/loaderWhiteSmall";
import UserFollow from "../helpers/profile/UserFollow";
import ProfilePurchases from "./components/purchases/ProfilePurchases";
import ProfileFans from "./components/fans/ProfileFans";
import { useSIWE } from "connectkit";
import ProfileHearts from "./components/hearts/ProfileHearts";

const indexerContractAddress = process.env.NEXT_PUBLIC_HITMAKR_INDEXER_ADDRESS_SKL;

export default function ProfilePage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { address: connectedAddress,isConnected } = useAccount();
    const {isSignedIn} = useSIWE();
    const [imageUrl, setImageUrl] = useState(null);
    const [isCopied, setIsCopied] = useState(false);
    
    const queryAddress = searchParams.get('address');
    const currentView = searchParams.get('view');
    const address = queryAddress || connectedAddress;

    // Updated hooks
    const { hasCreativeID: hasID, loading: creativeIdLoading, error: creativeIdError } = useHasCreativeIDRPC(address);
    const { details: profileDetails, loading: profileLoading, error: profileError } = useProfileDetailsRPC(address);

    useEffect(() => {
        if (!currentView && address) {
            router.replace(`/profile?address=${address}&view=about`);
        }
    }, [currentView, address, router]);

    useEffect(() => {
        if (profileDetails?.imageURI) {
            setImageUrl(profileDetails.imageURI);
        }
    }, [profileDetails]);

    const isOtherProfile = () => {
        return connectedAddress && 
               queryAddress && 
               connectedAddress.toLowerCase() !== queryAddress.toLowerCase();
    };

    const handleCopyAddress = async () => {
        if (address) {
            try {
                await navigator.clipboard.writeText(address);
                setIsCopied(true);
                setTimeout(() => {
                    setIsCopied(false);
                }, 5000);
            } catch (err) {
                console.error('Failed to copy address:', err);
            }
        }
    };

    const handleViewChange = (view) => {
        const newUrl = `/profile?address=${address}&view=${view}`;
        router.push(newUrl);
    };

    const getNavOptionClassName = (view) => {
        return `${styles.profilePageNavbarOption} ${currentView === view ? styles.active : ''}`;
    };

    const renderContent = () => {
        switch (currentView) {
            case 'about':
                return <ProfileAbout address={address}/>;
            case 'releases':
                return <ProfileReleases address={address} />;
            case 'purchases':
                return <ProfilePurchases address={address} indexerAddress={indexerContractAddress}/>;
            case 'fan':
                return <ProfileFans address={address}/>;
            case 'hearts':
                return <ProfileHearts address={address}/>;
            default:
                return <ProfileAbout address={address}/>;
        }
    };

    if (creativeIdLoading || profileLoading) {
        return <div className={styles.profilePageLoading}><LoaderWhiteSmall /></div>;
    }

    if (creativeIdError || profileError) {
        return <div className={styles.profilePageLoading}>Error loading profile</div>;
    }

    return (
        <div className={styles.profilePage}>
            <div className={styles.profilePageHeader}>
                <p>Profile</p>
            </div>
            <div className={styles.profilePageMain}>
                <div className={styles.profilePagePallet}>
                    {address && (
                        <TrianglifyPattern 
                            imageUrl={imageUrl}
                            fallbackAddress={address}
                            height={200}
                            cellSize={30}
                            variance={0.5}
                        />
                    )}
                </div>
                <div className={styles.profilePageImage}>
                    <GetDpByAddress 
                        address={address}
                        width={150}
                        height={150}
                    />
                </div>
                <div className={styles.profilePageName}>
                    <div className={styles.profilePageNameItem}>
                        <GetUsernameByAddress address={address}/>
                        {hasID &&
                            <>
                                <i className="fi fi-sr-shield-trust"></i>
                            </>
                        }
                    </div>
                    <div className={styles.profilePageNameAddress}>
                        {address &&
                            <p 
                                onClick={handleCopyAddress}
                                style={{ cursor: 'pointer' }}
                                title="Click to copy address"
                            >
                                {isCopied 
                                    ? "Copied!" 
                                    : `${address.slice(0, 7)}...${address.slice(-5)}`
                                }
                            </p>
                        }
                    </div>
                </div>
                <div className={styles.profilePageOptions}>
                    {/* {isOtherProfile() && hasID && (
                            <div className={styles.profilePageOption} onClick={() => handleViewChange('tip')}>
                                <i className="fi fi-rr-send-money"></i>
                            </div>
                        
                    )} */}
                    {isOtherProfile() &&
                        <>
                            <div className={styles.profilePageOption}>
                                <UserFollow
                                    userAddress={address}
                                />
                            </div>
                        </>
                    }
                </div>
            </div>
            <div className={styles.profilePageNavbar}>
                <div className={styles.profilePageNavbarOptions}>
                    <div 
                        className={getNavOptionClassName('about')}
                        onClick={() => handleViewChange('about')}
                    >
                        <p>About</p>
                    </div>
                    {hasID &&
                        <div 
                            className={getNavOptionClassName('releases')}
                            onClick={() => handleViewChange('releases')}
                        >
                            <p>Releases</p>
                        </div>
                    }
                    <div 
                        className={getNavOptionClassName('purchases')}
                        onClick={() => handleViewChange('purchases')}
                    >
                        <p>Purchases</p>
                    </div>
                    {isConnected && isSignedIn &&
                        <>
                            <div 
                                className={getNavOptionClassName('fan')}
                                onClick={() => handleViewChange('fan')}
                            >
                                <p>Fans</p>
                            </div>
                            <div 
                                className={getNavOptionClassName('hearts')}
                                onClick={() => handleViewChange('hearts')}
                            >
                                <p>Hearts</p>
                            </div>
                        </>
                    }
                    
                </div>
            </div>
            <div className={styles.profilePageDisplay}>
                {renderContent()}
            </div>
        </div>
    );
}