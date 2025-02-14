"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import abi from "./abi/abi";
import { useQuery } from "@tanstack/react-query";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_HITMAKR_VERIFICATION_ADDRESS;
const RPC_URL = process.env.NEXT_PUBLIC_SKALE_TESTNET_RPC_URL;

export const useVerificationStatusRPC = (address) => {
  const checkVerification = async () => {
    if (!address) return false;
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
    const data = await contract.verificationStatus(address);
    return data;
  };

  const {
    data: isVerified,
    isPending: loading,
    error,
  } = useQuery({
    queryKey: ["verificationStatus", address],
    queryFn: checkVerification,
    enabled: !!address,
  });

  return { isVerified, loading, error };
};

export const useHitmakrControlCenterRPC = () => {
  const getControlCenter = async () => {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
    const data = await contract.HITMAKR_CONTROL_CENTER();
    return data;
  };

  const {
    data: controlCenterAddress,
    isPending: loading,
    error,
  } = useQuery({
    queryKey: ["controlCenter"],
    queryFn: getControlCenter,
  });

  return { controlCenterAddress, loading, error };
};

export const useHitmakrProfilesRPC = () => {
  const getProfilesAddress = async () => {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
    const data = await contract.HITMAKR_PROFILES();
    return data;
  };

  const {
    data: profilesAddress,
    isPending: loading,
    error,
  } = useQuery({
    queryKey: ["profiles"],
    queryFn: getProfilesAddress,
  });

  return { profilesAddress, loading, error };
};

export const useIsContractPausedRPC = () => {
  const checkPauseStatus = async () => {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
    const data = await contract.paused();
    return data;
  };

  const {
    data: isPaused,
    isPending: loading,
    error,
  } = useQuery({
    queryKey: ["pauseStatus"],
    queryFn: checkPauseStatus,
  });

  return { isPaused, loading, error };
};