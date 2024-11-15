"use client"

import React, { useState, useRef, useEffect } from "react";
import { useGetDSRC } from "@/app/config/hitmakrdsrcfactory/hitmakrDSRCFactoryRPC";
import { useGetDSRCDetails } from "@/app/config/hitmakrdsrc/hitmakrDSRCRPC";
import { useDistributeRoyalties, useReceiveRoyalties } from "@/app/config/hitmakrdsrc/hitmakrDSRCWagmi";
import Image from "next/image";
import '@flaticon/flaticon-uicons/css/all/all.css';
import LoaderWhiteSmall from "@/app/components/animations/loaders/loaderWhiteSmall";
import { useAccount, useSwitchChain, useReadContract } from "wagmi";
import { skaleCalypsoTestnet } from 'viem/chains';
import { formatUnits, formatUSDC } from "@/app/helpers/FormatUnits";
import HitmakrMiniModal from "@/app/components/modals/HitmakrMiniModal";
import RouterPushLink from "@/app/helpers/RouterPushLink";
import styles from "../../components/releases/styles/ProfileReleases.module.css";
import GetUsernameByAddress from "@/app/helpers/profile/GetUsernameByAddress";

const USDC_ADDRESS = process.env.NEXT_PUBLIC_SKALE_TEST_USDC;
const USDC_ABI = [{
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
}];

const DSRCEarningsView = ({ dsrcid, onEarningsUpdate }) => {

    const [showDropdown, setShowDropdown] = useState(false);
    const [copyText, setCopyText] = useState("Copy DSRC");
    const [isDistributingPurchase, setIsDistributingPurchase] = useState(false);
    const [isDistributingRoyalty, setIsDistributingRoyalty] = useState(false);
    const [isReceivingRoyalty, setIsReceivingRoyalty] = useState(false);
    const [modalState, setModalState] = useState({
        show: false,
        title: "",
        description: ""
    });
    const [metadata, setMetadata] = useState(null);
    const [hasRoyalties, setHasRoyalties] = useState(false);
    const [hasPendingRoyalties, setHasPendingRoyalties] = useState(false);
    const [currentBalance, setCurrentBalance] = useState("0");


    const dropdownRef = useRef(null);
    const { routeTo } = RouterPushLink();


    const { address } = useAccount();
    const { switchChain } = useSwitchChain();
    

    const { dsrcAddress, isLoading: addressLoading } = useGetDSRC(dsrcid);
    const { details, loading: detailsLoading, refetch: refetchDetails } = useGetDSRCDetails(dsrcAddress);
    const { distribute, loading: distributeLoading, isCorrectChain } = useDistributeRoyalties(dsrcAddress);
    const { receiveRoyalties, loading: receiveLoading } = useReceiveRoyalties(dsrcAddress);


    const { data: usdcBalance } = useReadContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: 'balanceOf',
        args: [dsrcAddress],
        enabled: Boolean(dsrcAddress),
    });


    const isLoading = addressLoading || detailsLoading;


    useEffect(() => {
        if (details?.earnings && usdcBalance) {
            const pendingAmount = BigInt(details.earnings.pendingAmount || 0);
            const balance = BigInt(usdcBalance.toString());
            const purchaseEarnings = BigInt(details.earnings.purchaseEarnings || 0);

            setCurrentBalance(usdcBalance.toString());

            const actualBalance = balance - purchaseEarnings;
            
            setHasRoyalties(actualBalance > pendingAmount);
            
            setHasPendingRoyalties(pendingAmount > 0n);
        }
    }, [details?.earnings, usdcBalance]);

    useEffect(() => {
        if (details?.earnings) {
            const newEarnings = {
                purchaseEarnings: details.earnings.purchaseEarnings || "0",
                royaltyEarnings: details.earnings.royaltyEarnings || "0",
                pendingAmount: details.earnings.pendingAmount || "0"
            };
    
            const timeoutId = setTimeout(() => {
                onEarningsUpdate(newEarnings);
            }, 100);
    
            return () => clearTimeout(timeoutId);
        }
    }, [details?.earnings, onEarningsUpdate]);

    const truncateText = (text, maxLength = 15) => {
        if (typeof text !== 'string') return text;
        return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
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
            text: `Check out "${metadata.name}" on Hitmakr\nDSRC ID: ${dsrcid}\n`,
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

    const handleNetworkSwitch = async () => {
        try {
            await switchChain({ chainId: skaleCalypsoTestnet.id });
            return true;
        } catch (error) {
            console.error('Network switch error:', error);
            setModalState({
                show: true,
                title: "Network Switch Failed",
                description: "Please switch to Skale Calypso network to distribute earnings."
            });
            return false;
        }
    };

    const checkDistributionRequirements = () => {
        if (!address) {
            setModalState({
                show: true,
                title: "Connect Wallet",
                description: "Please connect your wallet to distribute earnings."
            });
            return false;
        }

        if (!isCorrectChain) {
            return handleNetworkSwitch();
        }

        return true;
    };

    const handleReceiveRoyalties = async () => {
        if (!await checkDistributionRequirements()) {
            return;
        }

        setIsReceivingRoyalty(true);

        try {
            const receipt = await receiveRoyalties();
            if (receipt) {
                await refetchDetails();
                setModalState({
                    show: true,
                    title: 'Royalties Received',
                    description: 'Successfully received royalties. You can now distribute them!'
                });
            }
        } catch (error) {
            console.error('Royalty reception error:', error);
            setModalState({
                show: true,
                title: 'Reception Failed',
                description: error.message || 'Failed to receive royalties. Please try again.'
            });
        } finally {
            setIsReceivingRoyalty(false);
        }
    };

    const handleDistribute = async (distributeType) => {
        const setLoading = distributeType === 0 
            ? setIsDistributingPurchase 
            : setIsDistributingRoyalty;
    
        if (!await checkDistributionRequirements()) {
            return;
        }
    
        setLoading(true);
    
        try {
            if (distributeType === 1) {
                if (hasRoyalties && !hasPendingRoyalties) {
                    await handleReceiveRoyalties();
                    await refetchDetails();
                }
            }

            const receipt = await distribute(distributeType);
            
            if (receipt) {
                if (distributeType === 0) {
                    const distributedAmount = BigInt(details.earnings.purchaseEarnings || 0);
                    const newBalance = BigInt(currentBalance) - distributedAmount;
                    setCurrentBalance(newBalance.toString());
                }

                setModalState({
                    show: true,
                    title: 'Distribution Successful',
                    description: `Successfully distributed ${distributeType === 0 ? 'purchase' : 'royalty'} earnings!`
                });

                await refetchDetails();
                
                if (onEarningsUpdate && details?.earnings) {
                    const updatedEarnings = {
                        ...details.earnings,
                        pendingAmount: "0",
                        purchaseEarnings: distributeType === 0 ? "0" : details.earnings.purchaseEarnings
                    };
                    onEarningsUpdate(updatedEarnings);
                }
            }
        } catch (error) {
            console.error('Distribution error:', error);
            setModalState({
                show: true,
                title: 'Distribution Failed',
                description: error.message || 'Failed to distribute earnings. Please try again.'
            });
        } finally {
            setLoading(false);
        }
    };

    if (isLoading || !metadata) {
        return <div className={styles.loading}><LoaderWhiteSmall /></div>;
    }

    if (!details) {
        return <div className={styles.error}><LoaderWhiteSmall /></div>;
    }

    const earnings = details.earnings || {
        purchaseEarnings: "0",
        royaltyEarnings: "0",
        pendingAmount: "0"
    };

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
                            <button onClick={handleCopyAddress}>
                                <i className={`fi ${copyText === "Copied!" ? "fi-rr-check" : "fi-rr-copy"}`} />
                                {copyText}
                            </button>
                            <button onClick={handleShare}>
                                <i className="fi fi-rr-share" />
                                Share
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
                        </div>
                    </div>
                    
                    <div className={styles.detailsWrapper}>
                        <h1 className={styles.title} onClick={()=>{routeTo(`/dsrc/${dsrcid}`)}}>{truncateText(metadata.name, 30)}</h1>
                        <div className={styles.idContainer}>
                            <p className={styles.description}onClick={()=> routeTo(`/profile?address=${details.creator}`)}>{<GetUsernameByAddress address={details.creator}/>}</p>
                            <span className={styles.chainPill}>
                                {details.selectedChain}
                            </span>
                        </div>

                        <div className={styles.earningsWrapper}>
                            <div className={styles.earningsRow}>
                                <div className={styles.earningCard}>
                                    <span className={styles.label}>Purchase Earnings</span>
                                    <span className={styles.value}>
                                        {formatUSDC(earnings.purchaseEarnings)}
                                    </span>
                                </div>
                                <div className={styles.earningCard}>
                                    <span className={styles.label}>Royalty Earnings</span>
                                    <span className={styles.value}>
                                        {formatUSDC(earnings.royaltyEarnings)}
                                    </span>
                                </div>
                                <div className={styles.earningCard}>
                                    <span className={styles.label}>Pending Amount</span>
                                    <span className={styles.value}>
                                        {formatUSDC(earnings.pendingAmount)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.dsrcMetadata}>
                    <div className={styles.dsrcMetadataLeft}>
                        <div className={styles.dsrcMetadataLeftOptions}>
                            <div className={styles.dsrcMetadataLeftOptionPrice}>
                                <i className="fi fi-rr-coins"></i>
                                {formatUSDC(earnings.pendingAmount)}$
                            </div>
                            <div className={styles.dsrcMetadataLeftOptionPrice}>
                                <i className="fi fi-rr-sack-dollar"></i>
                                {formatUSDC(BigInt(currentBalance) - BigInt(earnings.pendingAmount))}$
                            </div>
                        </div>
                    </div>

                    <div className={styles.dsrcMetadataRight}>
                        <div className={styles.distributionButtons}>
                            {hasPendingRoyalties && (
                                <button
                                    onClick={() => handleDistribute(0)}
                                    disabled={isDistributingPurchase || distributeLoading}
                                    className={`${styles.distributeButton} ${styles.purchaseButton}`}
                                >
                                    {isDistributingPurchase ? (
                                        <LoaderWhiteSmall />
                                    ) : (
                                        <>
                                            <i className="fi fi-rr-coins"></i>
                                            Distribute Purchase
                                        </>
                                    )}
                                </button>
                            )}

                            {hasRoyalties && (
                                <button
                                    onClick={() => handleDistribute(1)}
                                    disabled={
                                        isDistributingRoyalty || 
                                        distributeLoading || 
                                        isReceivingRoyalty || 
                                        receiveLoading
                                    }
                                    className={`${styles.distributeButton} ${styles.royaltyButton}`}
                                >
                                    {isDistributingRoyalty || isReceivingRoyalty ? (
                                        <LoaderWhiteSmall />
                                    ) : (
                                        <>
                                            <i className="fi fi-rr-sack-dollar"></i>
                                            {hasRoyalties && !hasPendingRoyalties ? 
                                                'Receive & Distribute Royalty' : 
                                                'Distribute Royalty'
                                            }
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

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
};

export default DSRCEarningsView;