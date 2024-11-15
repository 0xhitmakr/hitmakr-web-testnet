"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRecoilState } from "recoil";
import { useSignTypedData, useAccount } from 'wagmi';
import { ethers } from 'ethers';
import HitmakrCreativesStore from "@/app/config/store/HitmakrCreativesStore";
import { useGetDSRCNonce, 
    useGenerateDSRCSignature  } from "@/app/config/hitmakrdsrcfactory/hitmakrDSRCFactoryRPC";
import styles from "../../styles/Create.module.css";
import HitmakrButton from "@/app/components/buttons/HitmakrButton";
import RouterPushLink from "@/app/helpers/RouterPushLink";
import { toast } from 'react-hot-toast';

const DEFAULT_CHAIN = "SKL";
const BASIS_POINTS = 10000;
const API_BASE_URL = process.env.NEXT_PUBLIC_HITMAKR_SERVER;

export default function UploadButton() {
    const { address, chainId } = useAccount();
    const { signTypedDataAsync } = useSignTypedData();
    const { nonce, isLoading: nonceLoading } = useGetDSRCNonce(address);
    const { generateSignature } = useGenerateDSRCSignature();
    const { routeTo } = RouterPushLink();

    const [uploadState, setUploadState] = useRecoilState(HitmakrCreativesStore.CreativesUpload);
    const [uploadError, setUploadError] = useState(null);
    const [isFormValid, setIsFormValid] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [currentNonce, setCurrentNonce] = useState(0);


    useEffect(() => {
        if (!nonceLoading && nonce !== undefined) {
            setCurrentNonce(Number(nonce));
        }
    }, [nonce, nonceLoading]);

    const prepareRoyaltySplits = useCallback(() => {
        if (!uploadState.royaltySplits?.length) {
            throw new Error("Royalty splits are required");
        }
    
        const recipients = [];
        const percentages = [];
    
        console.log('Processing royalty splits:', uploadState.royaltySplits);
    
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
        console.log('Prepared splits - Total basis points:', total, 'Expected:', BASIS_POINTS);
    
        if (total !== BASIS_POINTS) {
            throw new Error(`Total percentage must equal exactly 100% (got ${total/100}%)`);
        }
    
        return { recipients, percentages };
    }, [uploadState.royaltySplits]);

    const handleDSRCCreation = async (tokenURI, uploadHash) => {
        if (!address) throw new Error("Wallet not connected");
        if (!uploadHash) throw new Error("Upload hash not found");
        if (nonceLoading) throw new Error("Waiting for nonce");
        if (typeof currentNonce !== 'number') throw new Error("Invalid nonce");

        try {
            const { recipients, percentages } = prepareRoyaltySplits();

            const deadline = Math.floor(Date.now() / 1000) + 3600; 

            const signatureParams = {
                tokenURI,
                price: ethers.parseUnits(uploadState.mintPrice.toString(), 6),
                recipients: recipients.map(addr => ethers.getAddress(addr)), 
                percentages: percentages, 
                nonce: BigInt(currentNonce),
                deadline: BigInt(deadline),
                selectedChain: uploadState.selectedChain || DEFAULT_CHAIN
            };

            console.log('Signature Params:', {
                ...signatureParams,
                price: signatureParams.price.toString(),
                percentages: signatureParams.percentages.map(String),
                nonce: signatureParams.nonce.toString(),
                deadline: signatureParams.deadline.toString()
            });

            const signatureResult = await generateSignature(signatureParams, signTypedDataAsync);
            
            if (!signatureResult?.signature) {
                throw new Error("Failed to generate signature");
            }

            console.log('Signature:', signatureResult.signature);

            const authToken = localStorage.getItem("authToken");
            if (!authToken) {
                throw new Error("Authentication token not found");
            }

            const response = await fetch(`${API_BASE_URL}/dsrc/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authToken}`,
                    "x-user-address": address,
                    "x-chain-id": chainId.toString()
                },
                body: JSON.stringify({
                    tokenURI,
                    price: signatureResult.params.price,
                    recipients: signatureResult.params.recipients,
                    percentages: signatureResult.params.percentages,
                    nonce: signatureResult.params.nonce,
                    deadline: signatureResult.params.deadline,
                    selectedChain: signatureResult.params.selectedChain,
                    signature: signatureResult.signature,
                    uploadHash
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
        formData.append("mintPrice", uploadState.mintPrice ?? 0);
        formData.append("copyrightChecked", uploadState.copyrightChecked);
        formData.append("selectedChain", uploadState.selectedChain || DEFAULT_CHAIN);
        formData.append("supportedChains", JSON.stringify([uploadState.selectedChain || DEFAULT_CHAIN]));

        if (uploadState.selectedCategory?.toLowerCase() === 'music' && uploadState.selectedLyrics?.trim()) {
            formData.append("lyrics", uploadState.selectedLyrics);
        }

        const authToken = localStorage.getItem("authToken");
        if (!authToken) {
            throw new Error("Authentication token not found");
        }

        const response = await fetch(`${API_BASE_URL}/upload/new-upload`, {
            method: "POST",
            body: formData,
            headers: {
                "Authorization": `Bearer ${authToken}`,
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
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            routeTo(`/profile?address=${address}&view=releases`);

        } catch (error) {
            toast.dismiss();
            const errorMessage = error.message || "Something went wrong!";
            console.log(errorMessage)
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
                    uploadState?.songDetails?.country &&
                    uploadState?.songDetails?.language &&
                    uploadState?.songDetails?.license &&
                    uploadState?.royaltySplits?.length > 0 &&
                    uploadState?.mintPrice !== undefined &&
                    uploadState?.mintPrice !== null &&
                    !isNaN(uploadState?.mintPrice) &&
                    uploadState?.copyrightChecked
                );
    
                if (!hasRequiredFields) {
                    console.log('Missing required fields');
                    setIsFormValid(false);
                    return;
                }
    
                if (!uploadState.royaltySplits?.length) {
                    console.log('No royalty splits found');
                    setIsFormValid(false);
                    return;
                }
    
                let totalPercentage = 0;
                for (const split of uploadState.royaltySplits) {
                    const normalizedAddress = split.address.toLowerCase();
                    if (!ethers.isAddress(normalizedAddress)) {
                        console.log('Invalid address:', split.address);
                        setIsFormValid(false);
                        return;
                    }
                    totalPercentage += parseFloat(split.percentage || 0);
                }
    
                console.log('Validation - Total percentage:', totalPercentage);
                
                if (Math.abs(totalPercentage - 100) > 0.01) {
                    console.log('Invalid total percentage:', totalPercentage);
                    setIsFormValid(false);
                    return;
                }
    
                setIsFormValid(true);
                console.log('Form validation passed');
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
                    isLoading={isLoading || nonceLoading}
                    disabled={!isFormValid || isLoading || nonceLoading || !currentNonce || !address}
                />
            </div>
        </div>
    );
}