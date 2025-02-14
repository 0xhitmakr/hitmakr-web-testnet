"use client";

import { ethers } from "ethers";
import abi from "./abi/abi.json";
import { useQuery } from "@tanstack/react-query";

const RPC_URL = process.env.NEXT_PUBLIC_SKALE_RPC_URL;

const getContract = (contractAddress) => {
  if (!contractAddress || contractAddress === ethers.ZeroAddress) return null;
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  return new ethers.Contract(contractAddress, abi, provider);
};

// Edition enum to match contract
const Edition = {
  Streaming: 0,
  Collectors: 1,
  Licensing: 2
};

export const useGetDSRCDetails = (contractAddress) => {
  const fetchDetails = async () => {
    const contract = getContract(contractAddress);

    const [
      dsrcId,
      tokenUri,
      creator,
      paymentToken,
      selectedChain,
      earningsInfo,
      streamingConfig,
      collectorsConfig,
      licensingConfig,
      totalSupply
    ] = await Promise.all([
      contract.dsrcId(),
      contract.tokenURI(1),
      contract.creator(),
      contract.paymentToken(),
      contract.selectedChain(),
      contract.getEarningsInfo(),
      contract.getEditionConfig(Edition.Streaming),
      contract.getEditionConfig(Edition.Collectors),
      contract.getEditionConfig(Edition.Licensing),
      contract.totalSupply_()
    ]);

    const editions = {
      streaming: {
        price: streamingConfig[0].toString(),
        isEnabled: streamingConfig[1],
        isCreated: streamingConfig[2]
      },
      collectors: {
        price: collectorsConfig[0].toString(),
        isEnabled: collectorsConfig[1],
        isCreated: collectorsConfig[2]
      },
      licensing: {
        price: licensingConfig[0].toString(),
        isEnabled: licensingConfig[1],
        isCreated: licensingConfig[2]
      }
    };

    return {
      dsrcId,
      tokenUri,
      creator,
      paymentToken,
      selectedChain,
      editions,
      totalSupply: totalSupply.toString(),
      earnings: {
        purchaseEarnings: earningsInfo[0].toString(),
        royaltyEarnings: earningsInfo[1].toString(),
        pendingAmount: earningsInfo[2].toString(),
        totalEarnings: earningsInfo[3].toString()
      }
    };
  };

  const {
    refetch,
    error,
    isPending: loading,
    data: details,
  } = useQuery({
    queryKey: ["dsrcDetails", contractAddress],
    queryFn: fetchDetails,
    enabled: !!contractAddress,
  });

  return { details, loading, error, refetch };
};

export const useHasPurchased = (contractAddress, address) => {
  const checkStatus = async () => {
    if (!address) return {
      streaming: false,
      collectors: false,
      licensing: false
    };
    const contract = getContract(contractAddress);
    const [streaming, collectors, licensing] = await Promise.all([
      contract.editionPurchased(address, Edition.Streaming),
      contract.editionPurchased(address, Edition.Collectors),
      contract.editionPurchased(address, Edition.Licensing),
    ]);
    return {
      streaming,
      collectors,
      licensing
    };
  };

  const {
    data: hasPurchased,
    isPending: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["purchased", contractAddress, address],
    queryFn: checkStatus,
    enabled: !!contractAddress && !!address,
  });

  return { hasPurchased, loading, error, refetch };
};

export const useGetEditionConfig = (contractAddress, edition) => {
  const fetchEditionConfig = async () => {
    const contract = getContract(contractAddress);
    const config = await contract.getEditionConfig(edition);
    return {
      price: config[0].toString(),
      isEnabled: config[1],
      isCreated: config[2]
    };
  };

  const {
    data: config,
    isPending: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["editionConfig", contractAddress, edition],
    queryFn: fetchEditionConfig,
    enabled: !!contractAddress,
  });

  return { config, loading, error, refetch };
};

export const useGetEarningsInfo = (contractAddress) => {
  const fetchEarnings = async () => {
    const contract = getContract(contractAddress);
    const earningsInfo = await contract.getEarningsInfo();
    return {
      purchaseEarnings: earningsInfo[0].toString(),
      royaltyEarnings: earningsInfo[1].toString(),
      pendingAmount: earningsInfo[2].toString(),
      totalEarnings: earningsInfo[3].toString(),
    };
  };

  const {
    data: earnings,
    isPending: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["earnings", contractAddress],
    queryFn: fetchEarnings,
    enabled: !!contractAddress,
  });

  return { earnings, loading, error, refetch };
};

export const useGetTokenEdition = (contractAddress, tokenId) => {
  const fetchTokenEdition = async () => {
    if (!tokenId) return null;
    const contract = getContract(contractAddress);
    const edition = await contract.getTokenEdition(tokenId);
    return edition;
  };

  const {
    data: edition,
    isPending: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["tokenEdition", contractAddress, tokenId],
    queryFn: fetchTokenEdition,
    enabled: !!contractAddress && !!tokenId,
  });

  return { edition, loading, error, refetch };
};

// Export the Edition enum for use in components
export { Edition };
