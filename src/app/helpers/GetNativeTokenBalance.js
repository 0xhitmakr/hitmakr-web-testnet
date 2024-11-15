"use client"
import { useBalance,useAccount } from "wagmi";
import { skaleCalypsoTestnet } from 'wagmi/chains'



export default function GetNativeTokenBalance() {
    const { address } = useAccount();
    const { data: balanceData } = useBalance({
        address: address,
        chainId: skaleCalypsoTestnet.id,
    });

    return { balanceData };
}