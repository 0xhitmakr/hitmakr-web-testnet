"use client";

import React, { useState, useEffect } from "react";
import styles from "../styles/Onboard.module.css";
import Image from "next/image";
import CampFireBg from "@/../public/images/creatives/campfire.png";
import Partners from "@/app/components/reuse/Partners";
import HitmakrButton from "@/app/components/buttons/HitmakrButton";
import { creativesLinks } from "@/lib/helpers/Links";
import ThirdPartyLinkFunction from "@/app/helpers/ThirdPartyLinkFunction";
import CampxHitmakrVideo from "@/../public/video/CampxHitmakr.mp4";
import { useAccount } from 'wagmi';
import { useSIWE } from 'connectkit';
import LoaderWhiteSmall from "@/app/components/animations/loaders/loaderWhiteSmall";
import '@flaticon/flaticon-uicons/css/all/all.css';
import HitmakrCreativesStore from "@/app/config/store/HitmakrCreativesStore";
import { useRecoilState } from "recoil";

export default function CampAuth() {
  const [isKnowMoreOpen, setIsKnowMoreOpen] = useState(true);
  const { handleThirdPartyLink, isLinkOpening } = ThirdPartyLinkFunction();
  const [buttonWidth, setButtonWidth] = useState("25%");
  const [spotifyData, setSpotifyData] = useState(null);
  const [isFetchingSpotifyData, setIsFetchingSpotifyData] = useState(false);
  const { address, chainId } = useAccount();
  const { isSignedIn } = useSIWE();
  const [spotifyDataState, setSpotifyDataState] = useRecoilState(HitmakrCreativesStore.HitmakrMySpotify);

  useEffect(() => {
    const updateButtonWidth = () => {
      if (window.innerWidth <= 450) {
        setButtonWidth("75%");
      } else if (window.innerWidth <= 950) {
        setButtonWidth("50%");
      } else {
        setButtonWidth("25%");
      }
    };

    window.addEventListener("resize", updateButtonWidth);
    updateButtonWidth();

    return () => {
      window.removeEventListener("resize", updateButtonWidth);
    };
  }, []);

  useEffect(() => {
    fetchSpotifyData(); 
  }, [address, isSignedIn, chainId]);


  const handleKnowMoreContainer = () => {
    setIsKnowMoreOpen(!isKnowMoreOpen);
  };


  const getSpotifyWebUrl = (uri) => {
    const userId = uri.split(':').pop();
    return `https://open.spotify.com/user/${userId}`;
  };


  const fetchSpotifyData = async () => {
    if (!address || !isSignedIn || !chainId) return; 

    setIsFetchingSpotifyData(true);

    try {
      const authToken = localStorage.getItem('authToken');
      const response = await fetch(`/api/creatives/camp/auth/spotify?searchWalletAddress=${address}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-User-Address': address,
          'X-Chain-Id': chainId.toString(),
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch Spotify data');
      }

      const data = await response.json();
      setSpotifyDataState({
        ...spotifyData,
        spotifyData: data,
        spotifyDataLoading: false, 
        spotifyDataError: null,
      });
      setSpotifyData(data);
    } catch (err) {
      console.error('Error:', err);
      setSpotifyDataState({
        ...spotifyData,
        spotifyData: undefined,
        spotifyDataLoading: false, 
        spotifyDataError: err.message,
      });
      setSpotifyData(null);
    } finally {
      setIsFetchingSpotifyData(false);
    }
  };

  return (
    <>
      <div className={styles.hitmakrCampWrapper}>
        <div className={styles.hitmakrCamp}>
          <div className={styles.hitmakrCampContainer}>
            <Image src={CampFireBg} width={"100%"} height={"100%"} alt="Hitmakr x Camp Background"/>
            <div className={styles.transparentLayer}></div>
            <div className={styles.transparentLayer2}></div>
            <div className={styles.hitmakrCampHeader}>
              <div className={styles.hitmakrCampAuthPartner}>
                <Partners partnerLogo={<i className="fi fi-br-fire-burner"></i>} />
              </div>
              <div className={styles.hitmakrCampAuthButton}>
                {isFetchingSpotifyData ? (
                  <div className={styles.hitmakrCampAuthLoadingButton}>
                    <LoaderWhiteSmall />
                  </div>
                ) : spotifyData && spotifyData.data ? (
                  <div
                    onClick={() => handleThirdPartyLink(getSpotifyWebUrl(spotifyData.data.spotifyUser.uri))}
                    className={styles.hitmakrCampAuthSpotifyButton}
                  >
                    <p>{spotifyData.data.spotifyUser.display_name.length > 15
                        ? spotifyData.data.spotifyUser.display_name.slice(0, 15) + '...'
                        : spotifyData.data.spotifyUser.display_name}</p>
                    <span>
                      <i className="fi fi-brands-spotify"></i>
                    </span>
                  </div>
                ) : (
                  <>
                    <HitmakrButton
                      buttonFunction={() => { handleThirdPartyLink(creativesLinks.campfireHub) }}
                      isLoading={isLinkOpening}
                      buttonName="Spotify Auth"
                      buttonWidth={buttonWidth}
                      isDark={false}
                    />
                    <button className={styles.refreshButton} onClick={fetchSpotifyData} disabled={isFetchingSpotifyData}>
                      {isFetchingSpotifyData ? (
                        <LoaderWhiteSmall />
                      ) : (
                        <i className="fi fi-rr-refresh"></i>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className={styles.hitmakrCampFooter}>
              <div className={styles.hitmakrCampFooterDescription}>
                {spotifyData && spotifyData.data ?
                  (
                    <p>
                      You will be redirected to the Campfire to disconnect Spotify.
                    </p>
                  ) : (
                    <p>
                      You will be redirected to the Campfire to verify Spotify.
                    </p>
                  )
                }

              </div>
              <div className={styles.hitmakrCampFooterKnowmore}>
                {spotifyData && spotifyData.data ?
                  (
                    <>
                      <p onClick={() => { handleThirdPartyLink(creativesLinks.campfireHub) }}>
                        <i className="fi fi-rr-exit"></i>
                      </p>
                    </>
                  ) : (
                    <p onClick={() => handleKnowMoreContainer()}>
                      <i className={`fi ${isKnowMoreOpen ? 'fi-sr-angle-circle-up' : 'fi-sr-angle-circle-down'}`}></i>
                    </p>
                  )
                }

              </div>
            </div>
          </div>
          {isKnowMoreOpen &&
            <>
              <div className={styles.hitmakrCampKnowmoreContainer}>
                <div className={styles.hitmakrCampKnowmoreContainerVideo}>
                  <video
                    className={styles.videoPlayer}
                    src={CampxHitmakrVideo}
                    autoPlay
                    loop
                    muted
                    playsInline
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            </>
          }
        </div>
      </div>
    </>
  );
}
