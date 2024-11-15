"use client"

import React, { useState, useRef, useEffect } from "react";
import styles from "../styles/ProfileReleases.module.css";
import { useGetDSRC } from "@/app/config/hitmakrdsrcfactory/hitmakrDSRCFactoryRPC";
import { useGetDSRCDetails, useHasPurchased } from "@/app/config/hitmakrdsrc/hitmakrDSRCRPC";
import { usePurchaseDSRC } from "@/app/config/hitmakrdsrc/hitmakrDSRCWagmi";
import Image from "next/image";
import '@flaticon/flaticon-uicons/css/all/all.css';
import LoaderWhiteSmall from "@/app/components/animations/loaders/loaderWhiteSmall";
import { useAccount, useSwitchChain } from "wagmi";
import { skaleCalypsoTestnet } from 'viem/chains';
import HitmakrMiniModal from "@/app/components/modals/HitmakrMiniModal";
import RouterPushLink from "@/app/helpers/RouterPushLink";
import HeartButton from "./HeartButton";
import AddToPlaylistModal from "./AddToPlaylistModal";
import GetUsernameByAddress from "@/app/helpers/profile/GetUsernameByAddress";
import { useMusicPlayer } from "@/app/config/audio/MusicPlayerProvider";

export default function DSRCView({dsrcid}) {
    const {
        playTrack,
        playPause,
        isPlaying,
        currentTrack,
        addToQueue,
    } = useMusicPlayer();

    const [showDropdown, setShowDropdown] = useState(false);
    const [copyText, setCopyText] = useState("Copy DSRC");
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
    const [modalState, setModalState] = useState({
        show: false,
        title: "",
        description: ""
    });
    const [metadata, setMetadata] = useState(null);
    
    const dropdownRef = useRef(null);
    const {routeTo} = RouterPushLink();

    const { address } = useAccount();
    const { switchChain } = useSwitchChain();
    
    const { dsrcAddress, isLoading: addressLoading } = useGetDSRC(dsrcid);
    const { details, loading: detailsLoading } = useGetDSRCDetails(dsrcAddress);
    const { hasPurchased, loading: purchaseCheckLoading, refetch: refetchPurchased } = useHasPurchased(dsrcAddress, address);
    const { purchase, loading: purchaseLoading, isCorrectChain } = usePurchaseDSRC(dsrcAddress);

    const isLoading = addressLoading || detailsLoading || purchaseCheckLoading;

    const isThisTrackPlaying = currentTrack === dsrcid && isPlaying;

    const handlePlayPause = () => {
        if (currentTrack === dsrcid) {
            playPause();
        } else {
            playTrack(dsrcid);
        }
    };

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
                setCopyText("Copy DSRC");
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchMetadata = async () => {
            if (details?.tokenUri) {
                try {
                    const response = await fetch(details.tokenUri);
                    if (!response.ok) throw new Error('Failed to fetch metadata');
                    const data = await response.json();
                    setMetadata(data);
                } catch (error) {
                    console.error("Error fetching metadata:", error);
                    setMetadata(null);
                }
            }
        };

        fetchMetadata();
    }, [details?.tokenUri]);

    const truncateText = (text, maxLength = 15) => {
        if (typeof text !== 'string') return text;
        return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
    };

    const formatValue = (attr) => {
        if (attr.trait_type === 'Royalty Splits') return null;

        let value = attr.value;
        if (Array.isArray(value)) {
            value = value.join(', ');
        } else if (attr.trait_type === 'Launch Price') {
            value = `${value} USDC`;
        } else if (typeof value === 'boolean') {
            value = value.toString();
        }
        return truncateText(value);
    };

    const handleAddToQueue = () => {
        addToQueue(dsrcid);
        setModalState({
            show: true,
            title: "Added to Queue",
            description: "DSRC has been added to your queue"
        });
        setShowDropdown(false);
    };

    const handleCopyAddress = async () => {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(dsrcAddress);
                setCopyText("Copied!");
            } else {
                prompt("Copy the address manually:", dsrcAddress);
                setCopyText("Manual Copy");
            }
    
            setTimeout(() => {
                setCopyText("Copy DSRC");
                setShowDropdown(false);
            }, 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
            setModalState({
                show: true,
                title: "Copy Failed",
                description: "Failed to copy DSRC address."
            });
            setTimeout(() => setCopyText("Copy DSRC"), 2000);
        }
    };

    const handleShare = async () => {
        if (!details || !metadata) return;
    
        const shareUrl = `${window.location.origin}/dsrc/${dsrcid}`;
        const shareData = {
            title: metadata.name,
            text: `Check out "${metadata.name}" on Hitmakr\nDSRC ID: ${dsrcid}\nDuration: ${metadata.duration || 'N/A'}\n`,
            url: shareUrl
        };
    
        try {
            if (navigator.share && navigator.canShare(shareData)) {
                await navigator.share(shareData);
            } else {
                const fallbackText = `${shareData.text}\n${shareUrl}`;
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(fallbackText);
                    setModalState({
                        show: true,
                        title: "Share Success",
                        description: "Share link copied to clipboard!"
                    });
                } else {
                    prompt("Copy this share link:", fallbackText);
                }
            }
        } catch (err) {
            console.error('Error sharing:', err);
            setModalState({
                show: true,
                title: "Share Failed",
                description: "Failed to share DSRC."
            });
        } finally {
            setShowDropdown(false);
        }
    };

    const handleOptionClick = (option) => {
        switch(option) {
            case 'add':
                handleAddToQueue();
                break;
            case 'playlist':
                setShowAddToPlaylist(true);
                setShowDropdown(false);
                break;
            case 'copy':
                handleCopyAddress();
                break;
            case 'share':
                handleShare();
                break;
            default:
                setShowDropdown(false);
        }
    };

    const handlePurchase = async () => {
        if (!address) {
            setModalState({
                show: true,
                title: "Connect Wallet",
                description: "Please connect your wallet to purchase this DSRC."
            });
            return;
        }

        if (hasPurchased) {
            setModalState({
                show: true,
                title: "Already Owned",
                description: "You already own this DSRC."
            });
            return;
        }

        setIsPurchasing(true);
        try {
            if (!isCorrectChain) {
                try {
                    await switchChain({ chainId: skaleCalypsoTestnet.id });
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (switchError) {
                    console.error("Network switch error:", switchError);
                    setModalState({
                        show: true,
                        title: "Network Switch Failed",
                        description: "Please switch to Skale Calypso network to purchase."
                    });
                    setIsPurchasing(false);
                    return;
                }
            }
            
            const receipt = await purchase();
            if (receipt) {
                setModalState({
                    show: true,
                    title: "Purchase Successful",
                    description: "Successfully purchased DSRC!"
                });
                await new Promise(resolve => setTimeout(resolve, 2000));
                await refetchPurchased();
            }
        } catch (error) {
            console.error("Purchase error:", error);
            
            if (error.message.includes('Insufficient USDC balance')) {
                const matches = error.message.match(/Required: ([\d.]+) USDC, Available: ([\d.]+) USDC/);
                if (matches) {
                    const [, required, available] = matches;
                    setModalState({
                        show: true,
                        title: "Insufficient Balance",
                        description: `You need ${required} USDC to purchase this DSRC. Your current balance is ${available} USDC.`
                    });
                } else {
                    setModalState({
                        show: true,
                        title: "Insufficient Balance",
                        description: "You don't have enough USDC to complete this purchase. Please Click on the $ icon at the Header"
                    });
                }
            } else if (error.message.includes('User rejected')) {
                setModalState({
                    show: true,
                    title: "Transaction Rejected",
                    description: "You rejected the transaction."
                });
            } else {
                setModalState({
                    show: true,
                    title: "Purchase Failed",
                    description: error.message || "Failed to purchase DSRC. Please try again."
                });
            }
        } finally {
            setIsPurchasing(false);
        }
    };

    if (isLoading || !metadata) {
        return <div className={styles.loading}><LoaderWhiteSmall /></div>;
    }

    if (!details) {
        return <div className={styles.error}><LoaderWhiteSmall /></div>;
    }

    const filteredAttributes = metadata.attributes
        .filter(attr => attr.trait_type !== 'Royalty Splits');

    return (
        <>
            <div className={styles.dsrcItem}>
                <div className={styles.menuContainer} ref={dropdownRef}>
                    <button 
                        className={styles.menuButton}
                        onClick={() => setShowDropdown(!showDropdown)}
                        aria-label="More options"
                    >
                        <i className="fi fi-sr-menu-dots-vertical" />
                    </button>
                    {showDropdown && (
                        <div className={styles.dropdown}>
                            <button onClick={() => handleOptionClick('copy')}>
                                <i className={`fi ${copyText === "Copied!" ? "fi-rr-check" : "fi-rr-copy"}`} />
                                {copyText}
                            </button>
                            <button onClick={() => handleOptionClick('share')}>
                                <i className="fi fi-rr-share" />
                                Share
                            </button>
                            <button onClick={() => handleOptionClick('add')}>
                                <i className="fi fi-rr-queue" />
                                Add to queue
                            </button>
                            <button onClick={() => handleOptionClick('playlist')}>
                                <i className="fi fi-rr-list-music" />
                                Add to playlist
                            </button>
                        </div>
                    )}
                </div>
    
                <div className={styles.dsrcContent}>
                    <div className={styles.imageWrapper}>
                        <div className={styles.imageContainer}>
                            <Image 
                                src={metadata.image} 
                                width={180} 
                                height={180} 
                                alt={`${metadata.name} only on Hitmakr`}
                                className={styles.coverImage}
                                unoptimized
                            />
                            <div className={styles.playOverlay}>
                                <button 
                                    onClick={handlePlayPause}
                                    className={`${styles.playButton} ${isThisTrackPlaying ? styles.playing : ''}`}
                                    aria-label={isThisTrackPlaying ? "Pause" : "Play"}
                                >
                                    <i className={`fi ${isThisTrackPlaying ? 'fi-sr-pause' : 'fi-sr-play'}`} />
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div className={styles.detailsWrapper}>
                        <h1 className={styles.title} onClick={()=> routeTo(`/dsrc/${dsrcid}`)}>{truncateText(metadata.name, 30)}</h1>
                        <div className={styles.idContainer}>
                            <>
                                <p className={styles.description} onClick={()=> routeTo(`/profile?address=${details.creator}`)}>{<GetUsernameByAddress address={details.creator}/>}</p>
                                <span className={styles.chainPill}>
                                    {details.selectedChain}
                                </span>
                            </>
                        </div>
                        
                        <div className={styles.attributesWrapper}>
                            <div className={styles.attributesRow}>
                                {filteredAttributes.map((attr, index) => {
                                    const formattedValue = formatValue(attr);
                                    if (formattedValue === null) return null;
                                    
                                    return (
                                        <div key={index} className={styles.attributeCard}>
                                            <span className={styles.attrLabel}>{attr.trait_type}</span>
                                            <span className={styles.attrValue}>{formattedValue}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
    
                <div className={styles.dsrcMetadata}>
                    <div className={styles.dsrcMetadataLeft}>
                        <div className={styles.dsrcMetadataLeftOptions}>
                            <div className={styles.dsrcMetadataLeftOption}>
                                <HeartButton 
                                    dsrcId={dsrcid} 
                                    showModal={(modalState) => setModalState(modalState)} 
                                />
                            </div>
                            <div onClick={() => routeTo(`/dsrc/${dsrcid}/comments`)} className={styles.dsrcMetadataLeftOption}>
                                <i className="fi fi-rr-smiley-comment-alt"></i>
                            </div>
                            <div onClick={() => routeTo(`/dsrc/${dsrcid}`)} className={styles.dsrcMetadataLeftOption}>
                                <i className="fi fi-rr-heart-rate"></i>
                            </div>
                            <div className={styles.dsrcMetadataLeftOptionPrice}>
                                <i className="fi fi-rr-dollar"></i> {details.price / 1000000}
                            </div>
                        </div>
                    </div>
                    <div className={styles.dsrcMetadataRight}>
                        <div className={styles.dsrcMetadataPurchaseButton}>
                            <button 
                                onClick={handlePurchase}
                                disabled={hasPurchased || isPurchasing || purchaseLoading}
                            >
                                {hasPurchased ? (
                                    <>Owned <i className="fi fi-sr-check-circle"></i></>
                                ) : isPurchasing || purchaseLoading ? (
                                    <LoaderWhiteSmall />
                                ) : (
                                    "Purchase"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {showAddToPlaylist && (
                <AddToPlaylistModal
                    dsrcId={dsrcid}
                    onClose={() => setShowAddToPlaylist(false)}
                    showSuccessMessage={(title, description) => 
                        setModalState({
                            show: true,
                            title,
                            description
                        })
                    }
                />
            )}

            {modalState.show && (
                <HitmakrMiniModal
                    title={modalState.title}
                    description={modalState.description}
                    closeButton={<i className="fi fi-br-cross-small"></i>}
                    closeFunction={() => setModalState({
                        show: false,
                        title: "",
                        description: ""
                    })}
                    isAction={true}
                />
            )}
        </>
    );
}