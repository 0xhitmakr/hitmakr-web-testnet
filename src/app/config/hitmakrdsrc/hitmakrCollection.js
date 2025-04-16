"use client";

import { ethers } from "ethers";
import { useQuery } from "@tanstack/react-query";
import { useReadContract, useWriteContract, useReadContracts } from "wagmi";
import { useAccount } from "wagmi";
import { useSkaleChainValidation } from "@/app/helpers/SkaleChainValidation";
import { useCallback, useEffect, useState } from "react";

const RPC_URL = process.env.NEXT_PUBLIC_SKALE_RPC_URL;
const COLLECTION_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_HITMAKR_COLLECTION_ADDRESS;

// Collection contract ABI
const collectionAbi = [
  {
    type: "constructor",
    inputs: [
      {
        name: "_verificationContract",
        type: "address",
        internalType: "address",
      },
      { name: "_dsrcFactory", type: "address", internalType: "address" },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "addDSRCToCollection",
    inputs: [
      { name: "collectionId", type: "uint256", internalType: "uint256" },
      { name: "dsrcAddress", type: "address", internalType: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "collections",
    inputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    outputs: [
      { name: "name", type: "string", internalType: "string" },
      { name: "description", type: "string", internalType: "string" },
      {
        name: "collectionType",
        type: "uint8",
        internalType: "enum HitmakrCollection.CollectionType",
      },
      { name: "createdAt", type: "uint40", internalType: "uint40" },
      { name: "exists", type: "bool", internalType: "bool" },
      { name: "coverArtUri", type: "string", internalType: "string" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "createCollection",
    inputs: [
      { name: "name", type: "string", internalType: "string" },
      { name: "description", type: "string", internalType: "string" },
      {
        name: "collectionType",
        type: "uint8",
        internalType: "enum HitmakrCollection.CollectionType",
      },
      { name: "coverArtUri", type: "string", internalType: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "creatorCollections",
    inputs: [
      { name: "", type: "address", internalType: "address" },
      { name: "", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getCollection",
    inputs: [
      { name: "collectionId", type: "uint256", internalType: "uint256" },
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct HitmakrCollection.Collection",
        components: [
          { name: "name", type: "string", internalType: "string" },
          { name: "description", type: "string", internalType: "string" },
          {
            name: "collectionType",
            type: "uint8",
            internalType: "enum HitmakrCollection.CollectionType",
          },
          { name: "createdAt", type: "uint40", internalType: "uint40" },
          { name: "exists", type: "bool", internalType: "bool" },
          {
            name: "dsrcAddresses",
            type: "address[]",
            internalType: "address[]",
          },
          { name: "coverArtUri", type: "string", internalType: "string" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getCreatorCollections",
    inputs: [{ name: "creator", type: "address", internalType: "address" }],
    outputs: [
      { name: "collectionIds", type: "uint256[]", internalType: "uint256[]" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "paused",
    inputs: [],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalCollections",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "toggleEmergencyPause",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
];

// Collection type enum to match contract
const CollectionType = {
  Album: 0,
  Mixtape: 1,
  Pack: 2,
};

/**
 * Hook for creating a collection using Wagmi (following the pattern from useRegisterCreativeID)
 */
export const useCreateCollection = () => {
  const { writeContract, isPending, data, isError, error } = useWriteContract();
  const { isConnected } = useAccount();
  const { validateAndSwitchChain, isSwitchingChain, isValidChain } =
    useSkaleChainValidation();

  const { data: isPaused } = useReadContract({
    address: COLLECTION_CONTRACT_ADDRESS,
    abi: collectionAbi,
    functionName: "paused",
    enabled: isConnected,
  });

  const createCollection = async (
    name,
    description,
    collectionType,
    coverArtUri
  ) => {
    if (!name || !coverArtUri) {
      console.error("Missing required fields");
      throw new Error("Name and cover art URI are required");
    }

    if (isPaused === true) {
      console.error("Contract is paused");
      throw new Error("Contract is paused");
    }

    try {
      console.log("Validating and switching chain...");
      const isChainValid = await validateAndSwitchChain();
      console.log("Chain validation result:", isChainValid);

      if (!isChainValid) {
        console.error("Chain validation failed");
        return;
      }

      console.log("Preparing to call writeContract with:", {
        address: COLLECTION_CONTRACT_ADDRESS,
        functionName: "createCollection",
        args: [name, description, collectionType, coverArtUri],
      });

      writeContract({
        address: COLLECTION_CONTRACT_ADDRESS,
        abi: collectionAbi,
        functionName: "createCollection",
        args: [name, description, collectionType, coverArtUri],
        enabled: isConnected && !isPaused,
      });

      console.log("writeContract called successfully");
    } catch (error) {
      console.error("Error creating collection:", error);
      throw error;
    }
  };

  return {
    createCollection,
    isPending: isPending || isSwitchingChain,
    data,
    isValidChain,
    isPaused,
    isError,
    error,
  };
};

/**
 * Hook for adding a DSRC to a collection using Wagmi
 */
export const useAddDSRCToCollection = () => {
  const { writeContract, isPending, data } = useWriteContract();
  const { isConnected } = useAccount();
  const { validateAndSwitchChain, isSwitchingChain, isValidChain } =
    useSkaleChainValidation();

  const { data: isPaused } = useReadContract({
    address: COLLECTION_CONTRACT_ADDRESS,
    abi: collectionAbi,
    functionName: "paused",
    enabled: isConnected,
  });

  const addDSRC = async (collectionId, dsrcAddress) => {
    if (!collectionId || !dsrcAddress)
      throw new Error("Collection ID and DSRC address are required");
    if (isPaused) throw new Error("Contract is paused");

    try {
      const isChainValid = await validateAndSwitchChain();
      if (!isChainValid) return;

      writeContract({
        address: COLLECTION_CONTRACT_ADDRESS,
        abi: collectionAbi,
        functionName: "addDSRCToCollection",
        args: [collectionId, dsrcAddress],
      });
    } catch (error) {
      console.error("Error adding DSRC to collection:", error);
      throw error;
    }
  };

  return {
    addDSRC,
    isPending: isPending || isSwitchingChain,
    data,
    isValidChain,
    isPaused,
  };
};

/**
 * Hook for toggling emergency pause using Wagmi
 */
export const useToggleEmergencyPause = () => {
  const { writeContract, isPending, data } = useWriteContract();
  const { isConnected } = useAccount();
  const { validateAndSwitchChain, isSwitchingChain, isValidChain } =
    useSkaleChainValidation();

  const togglePause = async () => {
    try {
      const isChainValid = await validateAndSwitchChain();
      if (!isChainValid) return;

      writeContract({
        address: COLLECTION_CONTRACT_ADDRESS,
        abi: collectionAbi,
        functionName: "toggleEmergencyPause",
      });
    } catch (error) {
      console.error("Error toggling pause:", error);
      throw error;
    }
  };

  return {
    togglePause,
    isPending: isPending || isSwitchingChain,
    data,
    isValidChain,
  };
};

/**
 * Hook to get a specific collection's details
 */
export const useGetCollection = (collectionId) => {
  const fetchCollection = async () => {
    if (!collectionId) return null;
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(
      COLLECTION_CONTRACT_ADDRESS,
      collectionAbi,
      provider
    );
    const collection = await contract.getCollection(collectionId);

    return {
      name: collection[0],
      description: collection[1],
      collectionType: Number(collection[2]),
      createdAt: Number(collection[3]) * 1000, // Convert to milliseconds
      exists: collection[4],
      dsrcAddresses: collection[5],
      coverArtUri: collection[6],
      collectionId,
    };
  };

  const {
    data: collection,
    isPending: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["collection", collectionId],
    queryFn: fetchCollection,
    enabled: !!collectionId,
  });

  return { collection, loading, error, refetch };
};


export const useGetCreatorCollections = (creatorAddress) => {
  const { isConnected } = useAccount();

  // First get the collection IDs
  const {
    data: collectionIds,
    isLoading: idsLoading,
    isError: idsError,
    error: idsErrorData,
  } = useReadContract({
    address: COLLECTION_CONTRACT_ADDRESS,
    abi: collectionAbi,
    functionName: "getCreatorCollections",
    args: [creatorAddress],
    enabled: isConnected && !!creatorAddress,
  });

  // Then get details for each collection
  const {
    data: collections = [],
    isLoading: collectionsLoading,
    isError: collectionsError,
    error: collectionsErrorData,
  } = useQuery({
    queryKey: ["collections", collectionIds],
    queryFn: async () => {
      if (!collectionIds || collectionIds.length === 0) return [];

      // Create an array of promises for each collection
      const collectionPromises = collectionIds.map(async (id) => {
        try {
          const result = await readContract({
            address: COLLECTION_CONTRACT_ADDRESS,
            abi: collectionAbi,
            functionName: "getCollection",
            args: [id],
          });

          return {
            collectionId: id.toString(),
            name: result.name,
            description: result.description,
            collectionType: Number(result.collectionType),
            createdAt: Number(result.createdAt) * 1000,
            exists: result.exists,
            dsrcAddresses: result.dsrcAddresses,
            coverArtUri: result.coverArtUri,
          };
        } catch (error) {
          console.error(`Error fetching collection ${id}:`, error);
          return null;
        }
      });

      // Wait for all promises to resolve
      const collectionsData = await Promise.all(collectionPromises);
      return collectionsData.filter(Boolean);
    },
    enabled: isConnected && !!collectionIds && collectionIds.length > 0,
  });

  return {
    collections,
    loading: idsLoading || collectionsLoading,
    error: idsError
      ? idsErrorData
      : collectionsError
      ? collectionsErrorData
      : null,
    refetch: () => refetchQueries(["collections", collectionIds]),
  };
};

/**
 * Helper hook to check if a user has any collections
 * @param {string} creatorAddress - Address of the creator
 * @returns {Object} Boolean indicating if user has collections, loading state
 */
export const useHasCollections = (creatorAddress) => {
  const { collections, loading, error } =
    useGetCreatorCollections(creatorAddress);
  const hasCollections = collections && collections.length > 0;

  return { hasCollections, loading, error };
};

export const useGetTotalCollections = () => {
  const { isConnected } = useAccount();

  const {
    data: totalCollections,
    isLoading,
    isError,
    error,
    refetch,
  } = useReadContract({
    address: COLLECTION_CONTRACT_ADDRESS,
    abi: collectionAbi,
    functionName: "totalCollections",
    enabled: isConnected,
  });

  return {
    totalCollections: totalCollections ? totalCollections.toString() : "0",
    loading: isLoading,
    error,
    refetch,
  };
};


/**
 * Hook to check if contract is paused
 */
export const useIsPaused = () => {
  const checkPaused = async () => {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(
      COLLECTION_CONTRACT_ADDRESS,
      collectionAbi,
      provider
    );
    return await contract.paused();
  };

  const {
    data: isPaused,
    isPending: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["collectionPaused"],
    queryFn: checkPaused,
  });

  return { isPaused, loading, error, refetch };
};

/**
 * Hook to get collections by type
 */
export const useGetCollectionsByType = (collectionType) => {
  const fetchCollectionsByType = async () => {
    if (collectionType === undefined) return [];

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(
      COLLECTION_CONTRACT_ADDRESS,
      collectionAbi,
      provider
    );
    const total = await contract.totalCollections();
    const collections = [];

    // Fetch all collections and filter by type
    // Note: This is inefficient but the contract doesn't have a direct method to get collections by type
    for (let i = 1; i <= total; i++) {
      try {
        const collection = await contract.getCollection(i);
        if (Number(collection[2]) === collectionType && collection[4]) {
          // Check type and exists
          collections.push({
            collectionId: i.toString(),
            name: collection[0],
            description: collection[1],
            collectionType: Number(collection[2]),
            createdAt: Number(collection[3]) * 1000,
            exists: collection[4],
            dsrcAddresses: collection[5],
            coverArtUri: collection[6],
          });
        }
      } catch (err) {
        console.error(`Error fetching collection ${i}:`, err);
      }
    }

    return collections;
  };

  const {
    data: collections,
    isPending: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["collectionsByType", collectionType],
    queryFn: fetchCollectionsByType,
    enabled: collectionType !== undefined,
  });

  return { collections, loading, error, refetch };
};

// Export the CollectionType enum for use in components
export { CollectionType };
