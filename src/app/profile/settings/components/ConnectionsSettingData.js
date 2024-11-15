"use client";

import React, { useState, useEffect } from "react";
import styles from "../styles/Settings.module.css";
import "@flaticon/flaticon-uicons/css/all/all.css";
import { useAccount } from "wagmi";
import { useSIWE } from "connectkit";
import ThirdPartyLinkFunction from "@/app/helpers/ThirdPartyLinkFunction";
import { creativesLinks } from "@/lib/helpers/Links";
import LoaderWhiteSmall from "@/app/components/animations/loaders/loaderWhiteSmall";

export default function ConnectionSettingData() {
  const { address, chainId } = useAccount();
  const { isSignedIn } = useSIWE();
  const [spotifyData, setSpotifyData] = useState(null);
  const [isFetchingSpotifyData, setIsFetchingSpotifyData] = useState(false);
  const { handleThirdPartyLink, isLinkOpening } = ThirdPartyLinkFunction();
  useEffect(() => {
    fetchSpotifyData();
  }, [address, isSignedIn, chainId]);

  const fetchSpotifyData = async () => {
    if (!address || !isSignedIn || !chainId) return;

    setIsFetchingSpotifyData(true);

    try {
      const authToken = localStorage.getItem("authToken");
      const response = await fetch(
        `/api/creatives/camp/auth/spotify?searchWalletAddress=${address}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "X-User-Address": address,
            "X-Chain-Id": chainId.toString(),
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch Spotify data");
      }

      const data = await response.json();
      setSpotifyData(data);
    } catch (err) {
      console.error("Error:", err);
      setSpotifyData(null);
    } finally {
      setIsFetchingSpotifyData(false);
    }
  };


  return (
    <>
      <div className={styles.connectionData}>
        
        <div className={styles.connectionDataOptions}>
          <div
            className={`${styles.connectionDataOption} ${
              spotifyData && spotifyData.data ? styles.spotify : ""
            }`}
            onClick={() => handleThirdPartyLink(creativesLinks.campfireHub)}
          >
            {isFetchingSpotifyData ?
              <LoaderWhiteSmall /> :
              <i className="fi fi-brands-spotify"></i>
              
            }
            {spotifyData && spotifyData.data && ( 
              <span>
                <i className="fi fi-sr-shield-trust"></i>
              </span>
            )}
          </div>
          <div className={`${styles.connectionDataOption}`}>
            <i className="fi fi-brands-twitter-alt"></i>
          </div>
          <div className={`${styles.connectionDataOption}`}>
            <i className="fi fi-brands-apple"></i>
          </div>
          <div className={`${styles.connectionDataOption}`}>
            <i className="fi fi-brands-discord"></i>
          </div>
          <div className={`${styles.connectionDataOption}`}>
            <i className="fi fi-brands-tik-tok"></i>
          </div>
          <div className={`${styles.connectionDataOption}`}>
            <i className="fi fi-brands-instagram"></i>
          </div>
          <div className={`${styles.connectionDataOption}`}>
            <i className="fi fi-brands-snapchat"></i>
          </div>
          <div className={`${styles.connectionDataOption}`}>
            <i className="fi fi-brands-reddit"></i>
          </div>
          <div className={`${styles.connectionDataOption}`}>
            <i className="fi fi-brands-google"></i>
          </div>
        </div>
      </div>
    </>
  );
}