"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRecoilState, useSetRecoilState, useResetRecoilState } from "recoil";
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import HitmakrCreativesStore from "@/app/config/store/HitmakrCreativesStore";
import { useGetYearCount } from "@/app/config/hitmakrdsrcfactory/hitmakrDSRCFactoryRPC";
import styles from "../../styles/Create.module.css";
import HitmakrButton from "@/app/components/buttons/HitmakrButton";
import RouterPushLink from "@/app/helpers/RouterPushLink";
import { toast } from 'react-hot-toast';

const DEFAULT_CHAIN = "SKL";
const BASIS_POINTS = 10000;
const API_BASE_URL = process.env.NEXT_PUBLIC_HITMAKR_SERVER;

export default function UploadButton() {
    const { address, chainId } = useAccount();
    const { yearCount, isLoading: yearCountLoading } = useGetYearCount(address);
    const { routeTo } = RouterPushLink();

    const [uploadState, setUploadState] = useRecoilState(HitmakrCreativesStore.CreativesUpload);
    const resetUploadState = useResetRecoilState(HitmakrCreativesStore.CreativesUpload);
    const resetNewCreativeUpload = useResetRecoilState(HitmakrCreativesStore.NewCreativeUpload);
    const setNewCreativeUpload = useSetRecoilState(HitmakrCreativesStore.NewCreativeUpload);

    const [uploadError, setUploadError] = useState(null);
    const [isFormValid, setIsFormValid] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [currentYearCount, setCurrentYearCount] = useState(0);

    useEffect(() => {
        if (!yearCountLoading && yearCount && yearCount.count !== undefined) {
            setCurrentYearCount(Number(yearCount.count));
        }
    }, [yearCount, yearCountLoading]);

    const resetAllStates = useCallback(() => {
        resetUploadState();
        resetNewCreativeUpload();
        setNewCreativeUpload(prev => ({
            ...prev,
            newUpload: false,
            tokenURI: "",
            editions: {
                streaming: { enabled: true, price: 0 },
                collectors: { enabled: false, price: 5 },
                licensing: { enabled: false, price: 100 }
            },
            royaltySplits: [],
            isGated: false,
            deadline: null
        }));
    }, [resetUploadState, resetNewCreativeUpload, setNewCreativeUpload]);

    const prepareRoyaltySplits = useCallback(() => {
        if (!uploadState.royaltySplits?.length) {
            throw new Error("Royalty splits are required");
        }

        const recipients = [];
        const percentages = [];

        for (const split of uploadState.royaltySplits) {
            const normalizedAddress = split.address.toLowerCase();
            if (!ethers.isAddress(normalizedAddress)) {
                throw new Error(`Invalid address format for ${split.role}: ${split.address}`);
            }

            const basisPoints = Math.round(parseFloat(split.percentage) * 100);

            if (isNaN(basisPoints) || basisPoints < 0 || basisPoints > BASIS_POINTS) {
                throw new Error(`Invalid percentage for ${split.role}: ${split.percentage}`);
            }

            recipients.push(normalizedAddress);
            percentages.push(basisPoints);
        }

        const total = percentages.reduce((a, b) => a + b, 0);
        if (total !== BASIS_POINTS) {
            throw new Error(`Total percentage must equal exactly 100% (got ${total/100}%)`);
        }

        return { recipients, percentages };
    }, [uploadState.royaltySplits]);

    const handleDSRCCreation = async (tokenURI, uploadHash) => {
        if (!address) throw new Error("Wallet not connected");
        if (!uploadHash) throw new Error("Upload hash not found");
        if (yearCountLoading) throw new Error("Waiting for year count");
        if (typeof currentYearCount !== 'number') throw new Error("Invalid year count");

        try {
            const { recipients, percentages } = prepareRoyaltySplits();

            const dsrcParams = {
                tokenURI,
                collectorsPrice: ethers.parseUnits(uploadState.editions.collectors.price.toString(), 6).toString(),
                licensingPrice: ethers.parseUnits(uploadState.editions.licensing.price.toString(), 6).toString(),
                recipients,
                percentages,
                selectedChain: uploadState.selectedChain || DEFAULT_CHAIN
            };

            const authToken = localStorage.getItem("@appkit/siwx-auth-token");
            const nonceToken = localStorage.getItem("@appkit/siwx-nonce-token");
            if (!authToken || !nonceToken) {
                throw new Error("Authentication token not found");
            }

            const response = await fetch(`${API_BASE_URL}/dsrc/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authToken}`,
                    "x-nonce-token": nonceToken,
                    "x-user-address": address,
                    "x-chain-id": chainId.toString()
                },
                body: JSON.stringify({
                    tokenURI,
                    uploadHash,
                    collectorsPrice: dsrcParams.collectorsPrice.toString(),
                    licensingPrice: dsrcParams.licensingPrice.toString(),
                    recipients: dsrcParams.recipients,
                    percentages: dsrcParams.percentages,
                    selectedChain: dsrcParams.selectedChain
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to create DSRC");
            }

            return await response.json();
        } catch (error) {
            console.error('DSRC Creation Error:', error);
            throw error;
        }
    };

    const handleUpload = async () => {
        const formData = new FormData();

        if (!uploadState.selectedFile || !uploadState.selectedCover) {
            throw new Error("Missing required files");
        }

        formData.append("song", uploadState.selectedFile);
        formData.append("coverImage", uploadState.selectedCover);
        formData.append("songDetails", JSON.stringify(uploadState.songDetails || {}));
        formData.append("subscribersUpload", uploadState.subscribersUpload);
        formData.append("selectedCategory", uploadState.selectedCategory);
        formData.append("royaltySplits", JSON.stringify(uploadState.royaltySplits || []));
        formData.append("editions", JSON.stringify(uploadState.editions));
        formData.append("copyrightChecked", uploadState.copyrightChecked);
        formData.append("selectedChain", uploadState.selectedChain || DEFAULT_CHAIN);
        formData.append("supportedChains", JSON.stringify([uploadState.selectedChain || DEFAULT_CHAIN]));

        if (uploadState.selectedCategory?.toLowerCase() === 'music' && uploadState.selectedLyrics?.trim()) {
            formData.append("lyrics", uploadState.selectedLyrics);
        }

        const authToken = localStorage.getItem("@appkit/siwx-auth-token");
        const nonceToken = localStorage.getItem("@appkit/siwx-nonce-token");
        if (!authToken || !nonceToken) {
            throw new Error("Authentication token not found");
        }

        const response = await fetch(`${API_BASE_URL}/upload/new-upload`, {
            method: "POST",
            body: formData,
            headers: {
                "Authorization": `Bearer ${authToken}`,
                "x-nonce-token": nonceToken,
                "x-user-address": address,
                "x-chain-id": chainId.toString()
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Upload failed");
        }

        return await response.json();
    };

    const handleSubmit = async () => {
        setUploadError(null);
        setIsLoading(true);

        try {
            if (!address) {
                throw new Error("Please connect your wallet");
            }

            if (!isFormValid) {
                throw new Error("Please fill in all required fields");
            }

            toast.loading("Uploading files...");
            const uploadResult = await handleUpload();
            toast.dismiss();

            toast.loading("Creating DSRC...");
            const { tokenURI, uploadHash } = uploadResult;
            await handleDSRCCreation(tokenURI, uploadHash);

            toast.dismiss();
            toast.success("Content uploaded successfully!");

            resetAllStates();
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            routeTo(`/profile?address=${address}&view=releases`);

        } catch (error) {
            toast.dismiss();
            const errorMessage = error.message || "Something went wrong!";
            console.log(errorMessage);
            setUploadError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const validateForm = () => {
            try {
                const hasRequiredFields = !!(
                    uploadState?.selectedFile &&
                    uploadState?.selectedCover &&
                    uploadState?.songDetails?.title?.trim() &&
                    uploadState?.songDetails?.description?.trim() &&
                    uploadState?.songDetails?.genre &&
                    uploadState?.songDetails?.country?.trim() &&
                    uploadState?.songDetails?.language?.trim() &&
                    uploadState?.songDetails?.license &&
                    uploadState?.royaltySplits?.length > 0 &&
                    uploadState?.editions?.collectors?.enabled && 
                    uploadState?.editions?.licensing?.enabled &&
                    uploadState?.copyrightChecked
                );

                setIsFormValid(hasRequiredFields);
            } catch (error) {
                console.error('Form validation error:', error);
                setIsFormValid(false);
            }
        };

        validateForm();
    }, [uploadState]);

    return (
        <div className={styles.uploadButtonContainer}>
            {uploadError && (
                <div className={styles.createUploadContainerInput}>
                    <div className={styles.verificationResult}>
                        <p className={styles.errorMessage}>{uploadError}</p>
                    </div>
                </div>
            )}
            <div className={styles.uploadButton}>
                <HitmakrButton
                    buttonName={isLoading ? "Processing..." : "Upload"}
                    isDark={!isFormValid || isLoading}
                    buttonWidth="50%"
                    buttonFunction={handleSubmit}
                    isLoading={isLoading || yearCountLoading}
                    disabled={!isFormValid || isLoading || yearCountLoading || !currentYearCount || !address}
                />
            </div>
        </div>
    );
}