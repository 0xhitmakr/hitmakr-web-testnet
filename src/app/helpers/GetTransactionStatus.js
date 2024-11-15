"use client"
import { useTransactionReceipt } from 'wagmi';


export function GetTransactionStatus(txHash,chainID){
    const { data:txReceiptData, isLoading:txReceiptLoading,isSuccess:txReceiptSuccess } = useTransactionReceipt({
        hash: `${txHash}`,
        chainId: chainID,
    })

    return({txReceiptData,txReceiptLoading,txReceiptSuccess})
}