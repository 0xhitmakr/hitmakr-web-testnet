"use client"

import { ethers } from 'ethers';

/**
 * Generates a signature for creative ID creation
 * @param {string} countryCode - Two-letter country code
 * @param {string} creativeCode - Five-character creative code
 * @param {Function} signMessageAsync - Function from wagmi's useSignMessage hook
 * @param {string} userAddress - Ethereum address of the user
 * @returns {Promise<{creativeID: string, signature: string, deadline: string, userAddress: string}>}
 */
export const generateCreativeIDSignature = async (countryCode, creativeCode, signMessageAsync, userAddress) => {
    if (!userAddress) throw new Error("User address is required");
    if (!isValidCreativeIDFormat(countryCode, creativeCode)) {
        throw new Error("Invalid creative ID format");
    }

    try {
        const creativeID = `${countryCode}${creativeCode}`;
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 600); // 10 minutes

        const params = {
            creativeID,
            deadline
        };

        const messageHash = await createMessageHash(params);
        const signature = await signMessageAsync({ 
            message: { raw: messageHash }
        });

        return {
            creativeID,
            signature,
            deadline: deadline.toString(),
            userAddress
        };
    } catch (error) {
        console.error("Error generating creative ID signature:", error);
        throw error;
    }
};

/**
 * Creates a keccak256 hash of the creative ID parameters
 * @param {Object} params - Parameters to hash
 * @param {string} params.creativeID - The full creative ID (country code + creative code)
 * @param {BigInt} params.deadline - Timestamp when the signature expires
 * @returns {string} - The keccak256 hash of the encoded parameters
 */
const createMessageHash = async (params) => {
    const abiCoder = new ethers.AbiCoder();
    
    const CREATIVE_ID_TYPEHASH = ethers.keccak256(
        ethers.toUtf8Bytes("CreativeIDParams(string creativeID,uint256 deadline)")
    );

    const encodedData = abiCoder.encode(
        ['bytes32', 'bytes32', 'uint256'],
        [
            CREATIVE_ID_TYPEHASH,
            ethers.keccak256(ethers.toUtf8Bytes(params.creativeID)),
            params.deadline
        ]
    );

    return ethers.keccak256(encodedData);
};

/**
 * Validates a creative ID format
 * @param {string} countryCode - Two-letter country code
 * @param {string} creativeCode - Five-character creative code
 * @returns {boolean} - True if the format is valid
 */
export const isValidCreativeIDFormat = (countryCode, creativeCode) => {
    // Check country code (2 uppercase letters)
    if (!countryCode || countryCode.length !== 2 || !/^[A-Z]{2}$/.test(countryCode)) {
        return false;
    }

    // Check creative code (5 alphanumeric characters)
    if (!creativeCode || creativeCode.length !== 5 || !/^[A-Z0-9]{5}$/.test(creativeCode)) {
        return false;
    }

    return true;
};