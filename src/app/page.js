"use client"

import React from "react";
import MainFooter from "./components/footer/MainFooter";
import styles from "./styles/MainPage.module.css";
import TopLiked from "./subcomps/TopLiked";
import TopCommented from "./subcomps/TopCommented";
import LatestSongs from "./subcomps/LatestSongs";

export default function Home() {
  return (
    <>
      <div className="childLayout">
          <div className={styles.mainPage}>
            <div className={styles.mainPageHeader}>
              <div className={styles.mainPageHeading}>
                <p>Home</p>
              </div>
            </div>
            <TopLiked />
            <TopCommented />
            <LatestSongs />
          </div>
            <MainFooter />
        </div>
    </>
  );
}
