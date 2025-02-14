"use client";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import abi from "./abi/abi";
import { useQuery } from "@tanstack/react-query";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_HITMAKR_PROFILES_ADDRESS;
const RPC_URL = process.env.NEXT_PUBLIC_SKALE_TESTNET_RPC_URL;

export const useHasProfile = (address) => {
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkProfile = async () => {
      try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
        const data = await contract._hasProfile(address);
        setHasProfile(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    if (address) checkProfile();
  }, [address]);

  return { hasProfile, loading, error };
};

export const useProfileAddressByName = (name) => {
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAddress = async () => {
      try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
        const nameHash = ethers.keccak256(ethers.toUtf8Bytes(name));
        const data = await contract._profileByNameHash(nameHash);
        setAddress(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    if (name) fetchAddress();
  }, [name]);

  return { address, loading, error };
};

export const useNameByAddress = (address) => {
  const fetchName = async () => {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
    return await contract._nameByAddress(address);
  };

  const { data: name, isPending: loading, isError: error } = useQuery({
    queryKey: ["name", address],
    queryFn: fetchName,
  });

  return { name, loading, error };
};

export const useProfileCount = () => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
        const data = await contract._profileCount();
        setCount(Number(data));
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCount();
  }, []);

  return { count, loading, error };
};

export const useTokenURI = (tokenId) => {
  const [tokenURI, setTokenURI] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTokenURI = async () => {
      try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
        const data = await contract.tokenURI(tokenId);
        setTokenURI(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    if (tokenId !== undefined) fetchTokenURI();
  }, [tokenId]);

  return { tokenURI, loading, error };
};

export const useOwnerOf = (tokenId) => {
  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOwner = async () => {
      try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
        const data = await contract.ownerOf(tokenId);
        setOwner(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    if (tokenId !== undefined) fetchOwner();
  }, [tokenId]);

  return { owner, loading, error };
};

export const useBalanceOf = (address) => {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
        const data = await contract.balanceOf(address);
        setBalance(Number(data));
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    if (address) fetchBalance();
  }, [address]);

  return { balance, loading, error };
};