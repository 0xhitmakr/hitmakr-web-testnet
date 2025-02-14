"use client"

import React from "react";
import { useAccount } from "wagmi";
import styles from "./styles/Onboard.module.css";
import CreativeID from "./components/CreativeID";
import LoaderWhiteSmall from "@/app/components/animations/loaders/loaderWhiteSmall";
import { useCreativeIDRPC } from "@/app/config/hitmakrcreativeid/hitmakrCreativeIDRPC";

const OnboardStep = ({ children, isLoading }) => (
    <>
      <div className="w-fit mx-auto mt-4 mb-4">
        <div className="flex items-center bg-zinc-900 text-white rounded-full px-4 py-2 text-sm font-semibold">
          Create
          <span className="ml-2 flex items-center">
            {!isLoading && (
              <i className="fi fi-rr-magic-wand flex items-center justify-center" />
            )}
          </span>
        </div>
      </div>
      {isLoading ? (
        <div className="flex justify-center">
          <LoaderWhiteSmall />
        </div>
      ) : (
        children
      )}
    </>
  );
  

export default function OnboardPage() {
    const { address } = useAccount();
    const { creativeIDInfo, loading: creativeIdLoading } = useCreativeIDRPC(address);

    if (creativeIdLoading) {
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
                <p>Create ID</p>
            </div>
            <OnboardStep isLoading={creativeIdLoading}>
                <CreativeID />
            </OnboardStep>
            <div className={styles.onboardSkip}>
                <div className={styles.onboardSkipContainer}>
                    <p>
                        {creativeIDInfo?.exists
                            ? "You have successfully created your Creative ID!"
                            : "Register your unique Creative ID to get started"}
                    </p>
                </div>
            </div>
        </div>
    );
}