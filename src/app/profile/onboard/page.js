"use client"

import React, { useMemo } from "react";
import { useRecoilValue } from "recoil";
import { useAccount } from "wagmi";
import styles from "./styles/Onboard.module.css";
import CampAuth from "./components/CampAuth";
import CreativeForm from "./components/CreativeForm";
import CreativeID from "./components/CreativeID";
import LoaderWhiteSmall from "@/app/components/animations/loaders/loaderWhiteSmall";
import HitmakrCreativesStore from "@/app/config/store/HitmakrCreativesStore";
import { useIsVerifiedRPC } from "@/app/config/hitmakrverification/hitmakrVerificationRPC";
import { useCreativeIDRPC } from "@/app/config/hitmakrcreativeid/hitmakrCreativeIDRPC";
import '@flaticon/flaticon-uicons/css/all/all.css';

const OnboardStep = ({ step, completed, children, isLoading }) => (
    <>
        <div className={styles.onboardBullet}>
            <p>
                Step {step}
                <span>
                    {completed && <i className="fi fi-sr-shield-trust"></i>}
                </span>
            </p>
        </div>
        {isLoading ? <div className={styles.onboardLoading}><LoaderWhiteSmall /></div> : children}
    </>
);

export default function OnboardPage() {
    const { address } = useAccount();
    const spotifyData = useRecoilValue(HitmakrCreativesStore.HitmakrMySpotify);
    
    const { isVerified, loading: verificationLoading } = 
        useIsVerifiedRPC(address);

    const { 
        creativeIDInfo,
        loading: creativeIdLoading,
    } = useCreativeIDRPC(address);


    const isLoading = spotifyData.spotifyDataLoading || verificationLoading || creativeIdLoading;

    const steps = useMemo(
        () => [
            {
                component: <CampAuth />,
                condition: true,
                loading: spotifyData.spotifyDataLoading,
                completed: spotifyData.spotifyData?.data ,
            },
            {
                component: <CreativeForm />,
                condition:  spotifyData && (spotifyData.spotifyData) && (spotifyData.spotifyData.data),
                loading: verificationLoading,
                completed: isVerified
            },
            {
                component: <CreativeID />,
                condition:  spotifyData.spotifyData?.data && isVerified,
                loading: creativeIdLoading,
                completed: creativeIDInfo?.exists || false
            }
        ],
        [
            spotifyData.spotifyData,
            isVerified,
            creativeIDInfo?.exists,
            spotifyData.spotifyDataLoading,
            verificationLoading,
            creativeIdLoading
        ]
    );

    const allStepsCompleted = 
        spotifyData.spotifyData?.data && 
        isVerified && 
        creativeIDInfo?.exists;

    if (isLoading) {
        return (
            <div className={styles.onboardPage}>
                <div className={styles.onboardPageLoader}>
                    <LoaderWhiteSmall />
                </div>
            </div>
        );
    }

    return (
        <div className={styles.onboardPage}>
            <div className={styles.onboardHeader}>
                <p>Onboard</p>
            </div>
            {steps.map((step, index) => 
                step.condition ? (
                    <OnboardStep
                        key={index}
                        step={index + 1}
                        completed={step.completed}
                        isLoading={step.loading}
                    >
                        {step.component}
                    </OnboardStep>
                ) : null
            )}
            <div className={styles.onboardSkip}>
                <div className={styles.onboardSkipContainer}>
                    <p>
                        {allStepsCompleted
                            ? "You can go ahead and create your music on Web3"
                            : "Wait until the previous step is completed"}
                    </p>
                </div>
            </div>
        </div>
    );
}