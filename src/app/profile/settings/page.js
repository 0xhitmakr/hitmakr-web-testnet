"use client";

import React, { useState } from "react";
import styles from "./styles/Settings.module.css";
import ProfileSettingsData from "./components/ProfileSettingData";
import ConnectionSettingData from "./components/ConnectionsSettingData";

export default function ProfileSettingsPage() {
  const [activeTab, setActiveTab] = useState("profile"); 

  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
  };

  return (
    <div className={styles.profileSettings}>
      <div className={styles.profileSettingsHeader}>
        <div className={styles.profileSettingsHeading}>
          <p>Settings</p>
        </div>
      </div>
      <div className={styles.profileSettingsOptions}>
        <div
          className={`${styles.profileSettingsOption} ${activeTab === 'profile' ? styles.profileSettingsOptionActive : ''
          }`}
          onClick={() => handleTabClick("profile")}
        >
          <span>Profile</span>
        </div>
        <div
          className={`${styles.profileSettingsOption} ${activeTab === 'connections' ? styles.profileSettingsOptionActive : ''
          }`}
          onClick={() => handleTabClick("connections")}
        >
          <span>Connections</span>
        </div>
      </div>
      {activeTab === "profile" && <ProfileSettingsData />} 
      {activeTab === "connections" && (
        <ConnectionSettingData />
      )}
    </div>
  );
}