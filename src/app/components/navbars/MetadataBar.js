"use client"

import React,{useState,useEffect} from "react";
import styles from "./styles/Metadatabar.module.css";
import { useAccount } from "wagmi";
import { useNameByAddress } from "@/app/config/hitmakrprofiles/HitmakrProfilesFunctions";
import WalletDisconnectFunction from "@/app/helpers/WalletDisconnectFunction";
import { useSIWE } from "connectkit";
import { usePathname } from "next/navigation";
import RouterPushLink from "@/app/helpers/RouterPushLink";

export default function MetadataBar(){
    const pathname = usePathname();
  const { address, isConnected,status:accountStatus, isDisconnected } = useAccount();
  const { isSignedIn,status: siweStatus } = useSIWE();
  const isActive = (path) => pathname.startsWith(path);
  const isActiveHome = (path) => pathname === path;
  const { routeTo, isRouterLinkOpening } = RouterPushLink();
  const { data: nameData, isLoading: nameLoading, error: nameError } =
    useNameByAddress(address);

    if(isConnected && isSignedIn && nameData && !isActiveHome("/auth")){
        return(<>
            <div className={styles.metadataBar}>
                <div className={styles.metadataBarContainer}>
                    
                </div>
            </div>
        </>)
    }
}