"use client";

import { useCallback } from 'react';
import { ethers } from 'ethers';

const CONTRACT_NAME = "HitmakrDSRCFactory";
const CONTRACT_VERSION = "1.0.0";
const SALT = ethers.keccak256(ethers.toUtf8Bytes("HITMAKR_DSRC_V1"));
const BASIS_POINTS = 10000;

export const useDSRCSignature = (contractAddress) => {
    const generateSignature = useCallback(
        async (signatureParams, signTypedDataAsync) => {
            if (!signTypedDataAsync) {
                throw new Error("signTypedDataAsync is not initialized");
            }

            if (!contractAddress) {
                throw new Error("Contract address is not provided");
            }

            try {
                // Format prices with 6 decimals for USDC
                const collectorsPrice = signatureParams.collectorsPrice; // Use params directly
                const licensingPrice = signatureParams.licensingPrice;   // Use params directly

                // Validate at least one edition has a price
                if (collectorsPrice === '0' && licensingPrice === '0') {
                    throw new Error("At least one edition must have a non-zero price");
                }

                // Format recipients and calculate basis points
                const recipients = signatureParams.recipients; // Use params directly
                const percentages = signatureParams.percentages; // Use params directly

                // Validate total equals 10000 basis points (100%)
                const totalBasisPoints = percentages.reduce((a, b) => a + b, 0);
                console.log('Total basis points:', totalBasisPoints);
                if (totalBasisPoints !== BASIS_POINTS) {
                    throw new Error(`Total percentage must equal 100% (got ${totalBasisPoints/100}%)`);
                }

                const selectedChain = signatureParams.selectedChain; // Use params directly
                const tokenURI = signatureParams.tokenURI; // Use params directly
                const nonce = signatureParams.nonce;       // Use params directly


                const domain = {
                    name: CONTRACT_NAME,
                    version: CONTRACT_VERSION,
                    verifyingContract: contractAddress,
                    salt: SALT
                };

                const types = {
                    DSRCParams: [
                        { name: "tokenURI", type: "string" },
                        { name: "collectorsPrice", type: "uint256" },
                        { name: "licensingPrice", type: "uint256" },
                        { name: "recipients", type: "address[]" },
                        { name: "percentages", type: "uint256[]" },
                        { name: "nonce", type: "uint256" },
                        { name: "selectedChain", type: "string" } // Removed deadline
                    ]
                };

                const message = {
                    tokenURI,
                    collectorsPrice,
                    licensingPrice,
                    recipients,
                    percentages,
                    nonce,
                    selectedChain // Removed deadline
                };

                const signature = await signTypedDataAsync({
                    domain,
                    message,
                    primaryType: "DSRCParams",
                    types
                });

                return {
                    signature,
                    params: message // Removed deadline from params
                };
            } catch (error) {
                console.error("Signature generation error:", error);
                throw error;
            }
        },
        [contractAddress]
    );

    return { generateSignature };
};