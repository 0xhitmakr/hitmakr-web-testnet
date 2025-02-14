import MainFooter from "./components/footer/MainFooter";
import React from "react";
import TopLiked from "./subcomps/TopLiked";
import TopCommented from "./subcomps/TopCommented";
import LatestSongs from "./subcomps/LatestSongs";
import styles from "./styles/MainPage.module.css";

const Home = () => {
  return (
    <section className="childLayout">
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
    </section>
  );
};

export default Home;
