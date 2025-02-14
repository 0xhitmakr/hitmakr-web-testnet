"use client";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useQuery } from "@tanstack/react-query";

const RPC_URL = process.env.NEXT_PUBLIC_SKALE_RPC_URL;
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_HITMAKR_DSRC_FACTORY_SKL;
// Make sure to import the correct ABI for HitmakrDSRCFactory
import abi from "./abi/abi.json"; // Assuming you have updated ABI and placed it here

const BASIS_POINTS = 10000;
const MAX_RECIPIENTS = 10;
const MAX_URI_LENGTH = 1000;
const MAX_UINT216 = BigInt(2n ** 216n - 1n);

const Edition = {
    Streaming: 0,
    Collectors: 1,
    Licensing: 2
};

const convertBigIntToString = (obj) => {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === "bigint") return obj.toString();
    if (Array.isArray(obj)) return obj.map((item) => convertBigIntToString(item));
    if (typeof obj === "object") {
        return Object.keys(obj).reduce((acc, key) => {
            acc[key] = convertBigIntToString(obj[key]);
            return acc;
        }, {});
    }
    return obj;
};

// Renamed hook from useGetDSRCNonce to useGetDSRCCountForYear
export const useGetDSRCCountForYear = (address, year) => {
    const { data: count, isLoading, error } = useQuery({
        queryKey: ["dsrcCountForYear", address, year], // Updated queryKey
        queryFn: async () => {
            if (!address || year === undefined) return null;
            const provider = new ethers.JsonRpcProvider(RPC_URL);
            const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
            const yearCount = await contract.yearCounts(address, year); // Fetch yearCounts
            return Number(yearCount);
        },
        enabled: !!address && year !== undefined,
    });

    return { count, isLoading, error };
};

export const useGetYearCount = useGetDSRCCountForYear; // Keeping old name for backward compatibility if needed

export const useGetDSRCByChain = (chain, dsrcId) => {
    const { data: dsrcAddress, isLoading, error } = useQuery({
        queryKey: ["dsrcByChain", chain, dsrcId],
        queryFn: async () => {
            if (!chain || !dsrcId) return null;
            const provider = new ethers.JsonRpcProvider(RPC_URL);
            const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
            const chainHash = ethers.keccak256(ethers.toUtf8Bytes(chain));
            const dsrcIdHash = ethers.keccak256(ethers.toUtf8Bytes(dsrcId));
            return await contract.chainDsrcs(chainHash, dsrcIdHash);
        },
        enabled: !!chain && !!dsrcId,
    });

    return { dsrcAddress, isLoading, error };
};

export const useGenerateDSRCSignature = () => {
    const generateSignature = async (params, signTypedDataAsync) => {
        try {
            const domain = {
                name: "HitmakrDSRCFactory",
                version: "1.0.0", // Ensure this matches your contract's version if applicable
                verifyingContract: CONTRACT_ADDRESS,
                // salt is not needed for createDSRC function signature
            };

            const types = {
                DSRCParams: [
                    { name: "tokenURI", type: "string" },
                    { name: "collectorsPrice", type: "uint256" },
                    { name: "licensingPrice", type: "uint256" },
                    { name: "recipients", type: "address[]" },
                    { name: "percentages", type: "uint256[]" },
                    { name: "selectedChain", type: "string" }
                ],
            };

            const signatureParams = {
                tokenURI: params.tokenURI,
                collectorsPrice: params.collectorsPrice,
                licensingPrice: params.licensingPrice,
                recipients: params.recipients,
                percentages: params.percentages,
                selectedChain: params.selectedChain
            };

            if (!signTypedDataAsync) {
                throw new Error("signTypedDataAsync function is required");
            }

            const signature = await signTypedDataAsync({
                domain,
                types,
                primaryType: "DSRCParams",
                message: signatureParams
            });

            return {
                signature,
                params: signatureParams
            };
        } catch (error) {
            console.error("Signature generation error:", error);
            throw error;
        }
    };

    return { generateSignature };
};

export const useValidateDSRCParams = () => {
    const validateParams = (params) => {
        try {
            const requiredFields = [
                "tokenURI",
                "collectorsPrice",
                "licensingPrice",
                "recipients",
                "percentages",
                "selectedChain",
            ];

            for (const field of requiredFields) {
                if (params[field] === undefined) { // Allow 0 for prices, but check for undefined
                    throw new Error(`Missing required field: ${field}`);
                }
            }

            if (!params.tokenURI || params.tokenURI.length === 0) {
                throw new Error("Token URI cannot be empty");
            }

            if (params.tokenURI.length > MAX_URI_LENGTH) {
                throw new Error(`Token URI too long (max ${MAX_URI_LENGTH} characters)`);
            }

            if (!Array.isArray(params.recipients) || params.recipients.length === 0) {
                throw new Error("Recipients must be a non-empty array");
            }

            if (params.recipients.length > MAX_RECIPIENTS) {
                throw new Error(`Too many recipients (maximum ${MAX_RECIPIENTS})`);
            }

            if (params.recipients.length !== params.percentages.length) {
                throw new Error("Recipients and percentages arrays must have the same length");
            }

            for (const recipient of params.recipients) {
                if (!recipient || recipient === "0x0000000000000000000000000000000000000000") {
                    throw new Error("Zero address not allowed in recipients");
                }
                try {
                    ethers.getAddress(recipient);
                } catch (e) {
                    throw new Error(`Invalid address: ${recipient}`);
                }
            }

            const totalPercentage = params.percentages.reduce(
                (sum, p) => sum + Number(p),
                0
            );
            if (totalPercentage !== BASIS_POINTS) {
                throw new Error(`Total percentage must be ${BASIS_POINTS} (100%), got: ${totalPercentage}`);
            }

            params.percentages.forEach(percentage => {
                if (percentage > BASIS_POINTS) {
                    throw new Error(`Percentage value exceeds maximum allowed (${BASIS_POINTS} or 100%): ${percentage}`);
                }
            });

            const collectorsPrice = BigInt(params.collectorsPrice || 0);
            const licensingPrice = BigInt(params.licensingPrice || 0);

            if (collectorsPrice === 0n && licensingPrice === 0n) {
                throw new Error("At least one paid edition (Collectors or Licensing) must have a non-zero price");
            }

            if (collectorsPrice > MAX_UINT216 || licensingPrice > MAX_UINT216) {
                throw new Error(`Price exceeds maximum allowed value (${MAX_UINT216.toString()} wei)`);
            }

            // Removed price unit conversion validation as it's handled in formatData

            return true;
        } catch (error) {
            throw new Error(`Validation error: ${error.message}`);
        }
    };

    return { validateParams };
};

export const useFormatDSRCData = () => {
    const formatData = (data) => {
        try {
            const validationResult = useValidateDSRCParams().validateParams(data);
            if (!validationResult) {
                throw new Error("Data validation failed");
            }

            const formatted = {
                tokenURI: data.tokenURI,
                collectorsPrice: ethers.parseUnits(data.collectorsPrice.toString(), 6),
                licensingPrice: ethers.parseUnits(data.licensingPrice.toString(), 6),
                recipients: data.recipients.map((addr) => ethers.getAddress(addr)),
                percentages: data.percentages.map((p) => p.toString()),
                selectedChain: data.selectedChain,
            };

            return formatted;
        } catch (error) {
            console.error("Error formatting DSRC data:", error);
            throw error;
        }
    };

    return { formatData };
};

export const useGetDSRC = (dsrcId) => {
    const { data: dsrcAddress, isPending: isLoading, error } = useQuery({
      queryKey: ["dsrcId", dsrcId],
      queryFn: async () => {
        if (!dsrcId) return null;
        
        try {
          const provider = new ethers.JsonRpcProvider(RPC_URL);
          const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
          
          // Hash the dsrcId here inside the hook
          const dsrcIdHash = ethers.keccak256(ethers.toUtf8Bytes(dsrcId));
          const address = await contract.dsrcs(dsrcIdHash);
          
          // Return null if zero address is returned
          return address === "0x0000000000000000000000000000000000000000" ? null : address;
        } catch (err) {
          console.error("Error fetching DSRC address:", err);
          throw new Error(`Failed to fetch DSRC address: ${err.message}`);
        }
      },
      enabled: Boolean(dsrcId),
    });
  
    return { dsrcAddress, isLoading, error };
  };

export const useVerifyDSRC = (dsrcAddress) => {
    const { data: isValid, isLoading, error } = useQuery({
        queryKey: ["verifyDSRC", dsrcAddress],
        queryFn: async () => {
            if (!dsrcAddress) return false;
            const provider = new ethers.JsonRpcProvider(RPC_URL);
            const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
            return await contract.isValidDSRC(dsrcAddress);
        },
        enabled: !!dsrcAddress,
    });

    return { isValid, isLoading, error };
};

// New read data hooks:

export const useGetControlCenter = () => {
    const { data: controlCenterAddress, isLoading, error } = useQuery({
        queryKey: ["controlCenterAddress"],
        queryFn: async () => {
            const provider = new ethers.JsonRpcProvider(RPC_URL);
            const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
            return await contract.controlCenter();
        },
    });

    return { controlCenterAddress, isLoading, error };
};

export const useGetCreativeID = () => {
    const { data: creativeIDAddress, isLoading, error } = useQuery({
        queryKey: ["creativeIDAddress"],
        queryFn: async () => {
            const provider = new ethers.JsonRpcProvider(RPC_URL);
            const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
            return await contract.creativeID();
        },
    });

    return { creativeIDAddress, isLoading, error };
};

export const useGetPurchaseIndexer = () => {
    const { data: purchaseIndexerAddress, isLoading, error } = useQuery({
        queryKey: ["purchaseIndexerAddress"],
        queryFn: async () => {
            const provider = new ethers.JsonRpcProvider(RPC_URL);
            const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
            return await contract.purchaseIndexer();
        },
    });

    return { purchaseIndexerAddress, isLoading, error };
};

export const useGetUSDC = () => {
    const { data: usdcAddress, isLoading, error } = useQuery({
        queryKey: ["usdcAddress"],
        queryFn: async () => {
            const provider = new ethers.JsonRpcProvider(RPC_URL);
            const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
            return await contract.USDC();
        },
    });

    return { usdcAddress, isLoading, error };
};


export { Edition, convertBigIntToString };