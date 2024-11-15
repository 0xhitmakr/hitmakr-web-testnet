"use client"
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import abi from './abi/abi.json';

const RPC_URL = process.env.NEXT_PUBLIC_SKALE_RPC_URL;
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_HITMAKR_DSRC_FACTORY_SKL;
const BASIS_POINTS = 10000;


const computeContractSalt = () => {
    return ethers.keccak256(ethers.toUtf8Bytes("HITMAKR_DSRC_V1"));
};

const convertBigIntToString = (obj) => {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'bigint') return obj.toString();
    if (Array.isArray(obj)) return obj.map(item => convertBigIntToString(item));
    if (typeof obj === 'object') {
        return Object.keys(obj).reduce((acc, key) => {
            acc[key] = convertBigIntToString(obj[key]);
            return acc;
        }, {});
    }
    return obj;
};


export const useGetDSRCNonce = (address) => {
    const [nonce, setNonce] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchNonce = async () => {
            if (!address) return;
            try {
                const provider = new ethers.JsonRpcProvider(RPC_URL);
                const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
                const currentNonce = await contract.getNonce(address);
                setNonce(Number(currentNonce));
            } catch (err) {
                console.error("Error fetching DSRC nonce:", err);
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchNonce();
    }, [address]);

    return { nonce, isLoading, error };
};


export const useGetCurrentYearCount = (address) => {
    const [yearCount, setYearCount] = useState({ year: 0, count: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchYearCount = async () => {
            if (!address) return;
            try {
                const provider = new ethers.JsonRpcProvider(RPC_URL);
                const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
                const [year, count] = await contract.getCurrentYearCount(address);
                setYearCount({
                    year: Number(year),
                    count: Number(count)
                });
            } catch (err) {
                console.error("Error fetching year count:", err);
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchYearCount();
    }, [address]);

    return { yearCount, isLoading, error };
};

export const useGetYearCount = (address, year) => {
    const [count, setCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchYearCount = async () => {
            if (!address || year === undefined || year === null) return;
            
            try {
                const provider = new ethers.JsonRpcProvider(RPC_URL);
                const contract = new ethers.Contract(
                    CONTRACT_ADDRESS,
                    abi,
                    provider
                );
                
                const yearCount = await contract.getYearCount(address, year);
                setCount(Number(yearCount));
            } catch (err) {
                console.error("Error fetching year count:", err);
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchYearCount();
    }, [address, year]);

    return { count, isLoading, error };
};


export const useGetDSRCByChain = (chain, dsrcId) => {
    const [dsrcAddress, setDsrcAddress] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDSRC = async () => {
            if (!chain || !dsrcId) return;
            try {
                const provider = new ethers.JsonRpcProvider(RPC_URL);
                const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
                const address = await contract.getDSRCByChain(chain, dsrcId);
                setDsrcAddress(address);
            } catch (err) {
                console.error("Error fetching DSRC:", err);
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDSRC();
    }, [chain, dsrcId]);

    return { dsrcAddress, isLoading, error };
};


export const useGenerateDSRCSignature = () => {
    const generateSignature = async (params, signTypedDataAsync) => {
        try {
            const domain = {
                name: "HitmakrDSRCFactory",
                version: "1.0.0",
                verifyingContract: CONTRACT_ADDRESS,
                salt: computeContractSalt()
            };

            const types = {
                DSRCParams: [
                    { name: 'tokenURI', type: 'string' },
                    { name: 'price', type: 'uint256' },
                    { name: 'recipients', type: 'address[]' },
                    { name: 'percentages', type: 'uint256[]' },
                    { name: 'nonce', type: 'uint256' },
                    { name: 'deadline', type: 'uint256' },
                    { name: 'selectedChain', type: 'string' }
                ]
            };

            // Format message parameters
            const message = {
                tokenURI: params.tokenURI,
                price: params.price,
                recipients: params.recipients,
                percentages: params.percentages.map(BigInt),
                nonce: params.nonce,
                deadline: params.deadline,
                selectedChain: params.selectedChain
            };

            console.log('Signing with domain:', {
                ...domain,
                salt: domain.salt
            });

            console.log('Signing message:', {
                ...message,
                price: message.price.toString(),
                percentages: message.percentages.map(p => p.toString()),
                nonce: message.nonce.toString(),
                deadline: message.deadline.toString()
            });

            const signature = await signTypedDataAsync({
                domain,
                types,
                primaryType: 'DSRCParams',
                message: {
                    ...message,
                    price: message.price.toString(),
                    percentages: message.percentages.map(p => p.toString()),
                    nonce: message.nonce.toString(),
                    deadline: message.deadline.toString()
                }
            });

            return {
                signature,
                params: {
                    ...message,
                    price: message.price.toString(),
                    percentages: message.percentages.map(p => p.toString()),
                    nonce: message.nonce.toString(),
                    deadline: message.deadline.toString()
                }
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
            // Basic validation
            const requiredFields = ['tokenURI', 'price', 'recipients', 'percentages', 'selectedChain'];
            for (const field of requiredFields) {
                if (!params[field]) {
                    throw new Error(`Missing required field: ${field}`);
                }
            }

            // Array validations
            if (!Array.isArray(params.recipients) || params.recipients.length === 0) {
                throw new Error("Recipients must be a non-empty array");
            }

            if (params.recipients.length > 100) {
                throw new Error("Too many recipients (maximum 100)");
            }

            if (params.recipients.length !== params.percentages.length) {
                throw new Error("Recipients and percentages arrays must have the same length");
            }

            // Address validation
            for (const recipient of params.recipients) {
                try {
                    ethers.getAddress(recipient); // Will throw if invalid
                } catch (e) {
                    throw new Error(`Invalid address: ${recipient}`);
                }
            }

            // Percentage validation
            const totalPercentage = params.percentages.reduce((sum, p) => sum + Number(p), 0);
            if (totalPercentage !== BASIS_POINTS) {
                throw new Error(`Total percentage must be ${BASIS_POINTS} (100%), got: ${totalPercentage}`);
            }

            // Price validation
            try {
                ethers.parseUnits(params.price.toString(), 6);
            } catch (error) {
                throw new Error("Invalid price format - must be convertible to 6 decimal places");
            }

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
                price: ethers.parseUnits(data.price.toString(), 6).toString(),
                recipients: data.recipients.map(addr => ethers.getAddress(addr)),
                percentages: data.percentages.map(p => p.toString()),
                selectedChain: data.selectedChain
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
    const [dsrcAddress, setDsrcAddress] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDSRC = async () => {
            if (!dsrcId) return;
            try {
                const provider = new ethers.JsonRpcProvider(RPC_URL);
                const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
                
                // Create hash for dsrcId
                const dsrcIdHash = ethers.keccak256(ethers.toUtf8Bytes(dsrcId));
                
                // Access the dsrcs mapping directly
                const address = await contract.dsrcs(dsrcIdHash);
                setDsrcAddress(address);
            } catch (err) {
                console.error("Error fetching DSRC:", err);
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDSRC();
    }, [dsrcId]);

    return { dsrcAddress, isLoading, error };
};