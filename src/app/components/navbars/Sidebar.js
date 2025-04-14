"use client";

import React, { useState, useEffect } from "react";
import styles from "./styles/Sidebar.module.css";
import { useAccount } from "wagmi";
import { usePathname } from "next/navigation";
import RouterPushLink from "@/app/helpers/RouterPushLink";
import "@flaticon/flaticon-uicons/css/all/all.css";
import ProfileSidebarOptions from "./subcomponents/ProfileSidebarOptions";
import { useRecoilState } from "recoil";
import LayoutStore from "@/app/config/store/LayoutStore";
import { useNameByAddress } from "@/app/config/hitmakrprofiles/hitmakrProfilesRPC";
import { useHasCreativeIDRPC } from "@/app/config/hitmakrcreativeid/hitmakrCreativeIDRPC";
import PlaylistDataOptions from "./subcomponents/PlaylistDataOptions";
import HitmakrButton from "../buttons/HitmakrButton";
import LoaderWhiteSmall from "../animations/loaders/loaderWhiteSmall";
import CollectionDataOptions from "./subcomponents/CollectionDataOptions";

export default function Sidebar() {
  const pathname = usePathname();
  const { address, isConnected, status: accountStatus } = useAccount();
  const isActive = (path) => pathname.startsWith(path);
  const isActiveHome = (path) => pathname === path;
  const { routeTo, isRouterLinkOpening } = RouterPushLink();
  const [viewMode, setViewMode] = useState("playlists"); // "playlists" or "collections"
  const [layoutMetadata, setLayoutMetadata] = useRecoilState(
    LayoutStore.LayoutMetadata
  );

  const { name: username, loading: nameLoading } = useNameByAddress(address);
  const {
    hasCreativeID,
    loading: creativeIDLoading,
    isPaused: isCreativeIDPaused,
  } = useHasCreativeIDRPC(address);

  const dataAvailable =
    !creativeIDLoading && hasCreativeID && !isCreativeIDPaused;
  const loginCheck = isConnected && username;
  const isLoading =
    accountStatus === "loading" ||
    (accountStatus === "loading" && nameLoading && username !== null);

  const toggleViewMode = () => {
    setViewMode(viewMode === "playlists" ? "collections" : "playlists");
  };

  if (isActiveHome("/auth")) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={styles.sidebar}>
        <div className={styles.sidebarContainer}>
          <div className={styles.sidebarLoading}>
            <LoaderWhiteSmall />
          </div>
        </div>
      </div>
    );
  }

  if (loginCheck) {
    return (
      <>
        <div className={styles.sidebar}>
          <div className={styles.sidebarContainer}>
            <div className={styles.sidebarHeader}>
              <div className={styles.sidebarHeaderTitle}>
                <span>
                  {isActive("/profile") ? (
                    <i
                      className={`fi ${
                        isActive("/profile")
                          ? `fi-sr-dashboard-panel`
                          : `fi-rr-dashboard-panel`
                      }`}
                    ></i>
                  ) : (
                    <i
                      className={`fi ${
                        isActive("/library")
                          ? `fi-sr-followcollection`
                          : `fi-rr-followcollection`
                      }`}
                    ></i>
                  )}
                </span>
                <span>
                  {isActive("/profile") ? <p>Panel</p> : <p>Library</p>}
                </span>
              </div>
              {!isActive("/profile") && (
                <div className={styles.viewToggle}>
                  <button
                    className={`${styles.toggleButton} ${
                      viewMode === "playlists" ? styles.activeToggle : ""
                    }`}
                    onClick={() => setViewMode("playlists")}
                  >
                    <span>Playlists</span>
                  </button>
                  <button
                    className={`${styles.toggleButton} ${
                      viewMode === "collections" ? styles.activeToggle : ""
                    }`}
                    onClick={() => setViewMode("collections")}
                  >
                    <span>Collections</span>
                  </button>
                </div>
              )}
              <div className={styles.sidebarHeaderOptions}>
                {/* {!isActive("/profile") && (
                  <div onClick={() => routeTo("/profile/playlist")} className={styles.sidebarHeaderOption}>
                    <span>
                      <i className={`fi ${isActive("/playlist") ? `fi-sr-plus` : `fi-rr-plus`}`}></i>
                    </span>
                  </div>
                )} */}
              </div>
            </div>
            {isActive("/profile") ? (
              <ProfileSidebarOptions dataAvailable={dataAvailable} />
            ) : (
              <div className={styles.sidebarOptions}>
                {viewMode === "playlists" ? (
                  <PlaylistDataOptions />
                ) : (
                  <CollectionDataOptions />
                )}
              </div>
            )}
          </div>
        </div>
        {isActive("/profile") && layoutMetadata.isProfileBarActive && (
          <div className={styles.sidebarProfile}>
            <div className={styles.sidebarProfileContainer}>
              <ProfileSidebarOptions dataAvailable={dataAvailable} />
            </div>
          </div>
        )}
        {isActive("/playlist") && layoutMetadata.isLibraryBarActive && (
          <div className={styles.sidebarLibrary}>
            <div className={styles.sidebarLibraryContainer}>
              <PlaylistDataOptions />
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebarContainer}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarHeaderTitle}>
            <span>
              <i className={`fi fi-rr-spy`}></i>
            </span>
            <span>
              <p>Anonymous</p>
            </span>
          </div>
        </div>
        <div className={styles.sidebarNoLogin}>
          <div className={styles.sidebarNoLoginDescription}>
            <p>
              Hey there, secret listener! 🎧 You're so close to the beat, but
              without logging in, it's like listening through a locked door.
              Ready to drop the bass and unlock the whole tracklist? Hit that{" "}
              <span>Join Now</span> button and let the Web3 music experience
              play loud and clear. Your front-row seat awaits! 🎶
            </p>
          </div>
          <div className={styles.sidebarNoLoginButton}>
            <HitmakrButton
              buttonName="Join Now"
              buttonWidth="90%"
              buttonFunction={() => routeTo("/auth")}
              isDark={false}
              isLoading={isRouterLinkOpening("/auth")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
