"use client";

import React from "react";
import styles from "../styles/Sidebar.module.css";
import { usePathname } from "next/navigation";
import RouterPushLink from "@/app/helpers/RouterPushLink";
import { useRecoilState } from "recoil";
import LayoutStore from "@/app/config/store/LayoutStore";


const ProfileSidebarOptions = ({ dataAvailable }) => {
  const profileSidebarOptionData = [
    { path: '/profile', icon: 'user', name: 'Profile' },
    { path: '/profile/playlist', icon: 'list-music', name: 'Playlist' },
    { path: '/profile/onboard', icon: 'shield-trust', name: 'Onboard', condition: !dataAvailable },
    { path: '/profile/create', icon: 'add', name: 'Create', condition: dataAvailable },
    { path: '/profile/earnings', icon: 'hand-holding-usd', name: 'Earnings', condition: dataAvailable },
    { path: '/profile/feedback', icon: 'feedback', name: 'Feedback' },
    { path: '/profile/copyright', icon: 'copyright', name: 'Copyright' },
    { path: '/profile/help', icon: 'interrogation', name: 'Help' },
    { path: '/profile/settings', icon: 'settings', name: 'Settings' },
  ];
  const pathname = usePathname();
  const isActive = (path) => pathname.startsWith(path);
  const isActiveHome = (path) => pathname === path;
  const { routeTo } = RouterPushLink();
  const [layoutMetadata, setLayoutMetadata] = useRecoilState(LayoutStore.LayoutMetadata);

  const closeProfileBarActive = () => {
    setLayoutMetadata({
      ...layoutMetadata,
      isProfileBarActive: false,
    });
  };

  const handleRouteAndClose = (path) => {
    closeProfileBarActive();
    routeTo(path);
  };

  return (
    <div className={styles.sidebarOptions}>
      {profileSidebarOptionData.map((option) => (
        (option.condition === undefined || option.condition) && (
          <div
            key={option.path}
            className={`${styles.sidebarOption} ${
              isActiveHome(option.path) ? styles.sidebarOptionActive : ""
            }`}
            onClick={() => handleRouteAndClose(option.path)}
          >
            <div className={styles.sidebarOptionIcon}>
              <i
                className={`fi ${
                  isActiveHome(option.path)
                    ? `fi-sr-${option.icon}`
                    : `fi-rr-${option.icon}`
                }`}
              ></i>
            </div>
            <div className={styles.sidebarOptionName}>
              <p>{option.name}</p>
            </div>
          </div>
        )
      ))}
      <div className="marginBottom200px"></div>
    </div>
  );
};

export default ProfileSidebarOptions;