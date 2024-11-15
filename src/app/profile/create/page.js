"use client"

import React, { useState, useEffect } from "react";
import styles from "./styles/Create.module.css";
import { useAccount } from "wagmi";
import RouterPushLink from "@/app/helpers/RouterPushLink";
import LoaderWhiteSmall from "@/app/components/animations/loaders/loaderWhiteSmall";
import Upload from "./components/Upload";
import { useCreativeIDRPC } from "@/app/config/hitmakrcreativeid/hitmakrCreativeIDRPC";

export default function CreatePage(){
    const { address } = useAccount();
    const { routeTo, isRouterLinkOpening } = RouterPushLink();
    const [isLoading, setIsLoading] = useState(false);
    const { 
        creativeIDInfo,
        loading: creativeIdLoading,
    } = useCreativeIDRPC(address);

    useEffect(()=>{
        if(!creativeIdLoading && !creativeIDInfo.exists){
            routeTo("/profile/onboard")
        }
    },[creativeIDInfo,creativeIdLoading])

    

    if (isLoading) {
        return (
            <div className={styles.createPage}>
                <div className={styles.createPageLoader}>
                    <LoaderWhiteSmall />
                </div>
            </div>
        );
    }
    return(<>
        <div className={styles.createPage}>
            <div className={styles.createPageHeader}>
                <p>CREATE</p>
            </div>
            <Upload />
        </div>
        
    </>)
}