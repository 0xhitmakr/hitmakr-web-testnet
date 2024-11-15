"use client";

import React from "react";
import ReactDOM from "react-dom";
import styles from "../styles/HomeMainBar.module.css";
import Image from "next/image";
import RouterPushLink from "@/app/helpers/RouterPushLink";
import { useAccount } from "wagmi";
import { useHasCreativeIDRPC } from "@/app/config/hitmakrcreativeid/hitmakrCreativeIDRPC";
import WalletDisconnectFunction from "@/app/helpers/WalletDisconnectFunction";
import LoaderWhiteSmall from "../../animations/loaders/loaderWhiteSmall";
import GenerateDp from "@/app/helpers/profile/GenerateDP";

const ProfileBar = ({ isOpen, profileBarRef, nameData }) => {
  const { routeTo } = RouterPushLink();
  const { address } = useAccount();
  const { 
    hasCreativeID, 
    loading: creativeIDLoading, 
    error: creativeIDError,
    isPaused 
  } = useHasCreativeIDRPC(address);
  
  const { handleWalletDisconnect, isDisconnecting } = WalletDisconnectFunction();

  if (typeof window !== "undefined" && isOpen) {
    return ReactDOM.createPortal(
      <div className={styles.mainProfileBar} ref={profileBarRef}>
        <div className={styles.mainProfileBarOptions}>
          <div
            className={styles.mainProfileBarOption}
            onClick={() => routeTo(`/profile?address=${address}`)}
          >
            <div className={styles.mainProfileBarOptionProfile}>
              <div className={styles.mainProfileBarOptionProfileImage}>
                <GenerateDp seed={address} width={100} height={100} />
              </div>
              <div className={styles.mainProfileBarOptionProfileDetails}>
                <p>
                  {nameData}{" "}
                  {!creativeIDLoading && hasCreativeID && !isPaused && (
                    <i className="fi fi-sr-badge-check"></i>
                  )}
                </p>
                <span>
                  {address.slice(0, 6)}...{address.slice(-4)}
                </span>
              </div>
            </div>
          </div>
          
          <div
            className={styles.mainProfileBarOption}
            onClick={() => routeTo("/profile/settings")}
          >
            <i className="fi fi-rr-settings"></i>
            <p>Settings</p>
          </div>
          <div
            className={styles.mainProfileBarOption}
            onClick={() => routeTo("/profile/help")}
          >
            <i className="fi fi-rr-interrogation"></i>
            <p>Help</p>
          </div>
          <div
            className={styles.mainProfileBarOption}
            onClick={() => handleWalletDisconnect()}
          >
            {isDisconnecting ? (
              <LoaderWhiteSmall />
            ) : (
              <>
                <i className="fi fi-rr-power"></i>
                <p>Logout</p>
              </>
            )}
          </div>
        </div>
      </div>,
      document.body 
    );
  }

  return null;
};

export default ProfileBar;