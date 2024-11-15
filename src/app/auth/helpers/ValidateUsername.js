"use client"

import React, { useEffect } from "react";
import { useRecoilState } from "recoil";
import { useRegister, useProfileAddressByName } from "@/app/config/hitmakrprofiles/hitmakrProfilesWagmi";
import HitmakrProfileStore from "@/app/config/store/HitmakrProfileStore";
import { address0 } from "@/lib/secure/Config";
import { GetTransactionStatus } from "@/app/helpers/GetTransactionStatus";
import { skaleChainId } from "@/lib/secure/Config";
import RouterPushLink from "@/app/helpers/RouterPushLink";


export default function ValidateUsername() {
    const [hitmakrProfileMintState, setHitmakrProfileMintState] = useRecoilState(HitmakrProfileStore.HitmakrProfileMint);
    const [hitmakrProfileState, setHitmakrProfileState] = useRecoilState(HitmakrProfileStore.HitmakrProfile);
    const {routeTo} = RouterPushLink();
    
    const { data: addressData } = useProfileAddressByName(hitmakrProfileMintState.mintName);
    const { register, data: hitmakrProfileMintTxHash } = useRegister();
    const chainId = skaleChainId;
    
    const { txReceiptData, txReceiptLoading, txReceiptSuccess } = GetTransactionStatus(hitmakrProfileMintTxHash, chainId);

    const MintName = () => {
        if (hitmakrProfileMintState.mintNameStatus) {
            try {
                setHitmakrProfileMintState((prevState) => ({
                    ...prevState,
                    isMintLoading: true,
                }));
                if (hitmakrProfileMintState.mintNameStatus) {
                    register(hitmakrProfileMintState.mintName);
                }
            } catch {
                console.log("Something went wrong on minting!");
            }
        }
    };

    useEffect(() => {
        if (hitmakrProfileMintTxHash !== undefined) {
            if (txReceiptData?.status !== "success") {
                setHitmakrProfileMintState((prevState) => ({
                    ...prevState,
                    isMintLoading: true,
                }));
            } else if (txReceiptData?.status === "success") {
                setHitmakrProfileMintState((prevState) => ({
                    ...prevState,
                    isMintLoading: false,
                }));
                setHitmakrProfileState((prevState) => ({
                    ...prevState,
                    isHitmakrUser: true,
                    mintName: `${hitmakrProfileMintState.mintName}`,
                }));
                routeTo("/")
            }
        }
    }, [hitmakrProfileMintTxHash, setHitmakrProfileMintState, setHitmakrProfileState, txReceiptData?.status, hitmakrProfileMintState.mintName]);

    useEffect(() => {
        if (hitmakrProfileMintState.mintName.length >= 3 && hitmakrProfileMintState.mintName.length <= 20) {
            if (addressData === address0) {
                setHitmakrProfileMintState((prevState) => ({
                    ...prevState,
                    mintNameStatus: true,
                }));
            } else {
                setHitmakrProfileMintState((prevState) => ({
                    ...prevState,
                    mintNameStatus: false,
                }));
            }
        } else {
            setHitmakrProfileMintState((prevState) => ({
                ...prevState,
                mintNameStatus: false,
            }));
        }
    }, [addressData, hitmakrProfileMintState.mintName.length, setHitmakrProfileMintState]);

    return { MintName };
}