"use client"
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import abi from './abi/abi.json';

const RPC_URL = process.env.NEXT_PUBLIC_SKALE_RPC_URL;
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS;

export const useUSDCBalance = (address) => {
    const [balance, setBalance] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBalance = async () => {
            if (!address) return;
            try {
                const provider = new ethers.JsonRpcProvider(RPC_URL);
                const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
                const rawBalance = await contract.balanceOf(address);
                const formattedBalance = Number(ethers.formatUnits(rawBalance, 6));
                setBalance(formattedBalance);
            } catch (err) {
                console.error("Error fetching USDC balance:", err);
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBalance();
    }, [address]);

    return { balance, isLoading, error };
};

export const useUSDCTotalSupply = () => {
  const [totalSupply, setTotalSupply] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
      const fetchTotalSupply = async () => {
          try {
              const provider = new ethers.JsonRpcProvider(RPC_URL);
              const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
              const rawTotalSupply = await contract.totalSupply();
              const formattedTotalSupply = Number(ethers.formatUnits(rawTotalSupply, 6));
              setTotalSupply(formattedTotalSupply);
          } catch (err) {
              console.error("Error fetching USDC total supply:", err);
              setError(err);
          } finally {
              setIsLoading(false);
          }
      };

      fetchTotalSupply();
  }, []);

  return { totalSupply, isLoading, error };
};

export const useUSDCAllowance = (ownerAddress, spenderAddress) => {
    const [allowance, setAllowance] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAllowance = async () => {
            if (!ownerAddress || !spenderAddress) return;

            try {
                const provider = new ethers.JsonRpcProvider(RPC_URL);
                const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
                const rawAllowance = await contract.allowance(ownerAddress, spenderAddress);
                const formattedAllowance = Number(ethers.formatUnits(rawAllowance, 6));
                setAllowance(formattedAllowance);
            } catch (err) {
                console.error("Error fetching allowance:", err);
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllowance();
    }, [ownerAddress, spenderAddress]);

    return { allowance, isLoading, error };
};