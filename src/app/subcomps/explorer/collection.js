"use client";

import React from "react";
import styles from "../styles/explorer.module.css";
import useSetSearchParams from "@/app/explore/use-searchparams";

export const collection = ["Music", "Sound", "Loop", "Instrumentals", "SFX"];
export const Color = ["#e85c41", "#6c5ce7", "#e84393", "#00b894", "#ff9ff3"];

const Collection = () => {
  const setSearchParams = useSetSearchParams();

  return (
    <React.Fragment>
      {collection.map((item, idx) => (
        <div
          className={`${styles.card}`}
          key={item}
          style={{
            background: Color[idx],
          }}
          onClick={() =>
            setSearchParams({
              explore_type: "explore",
              category: item.toLowerCase(),
            })
          }
        >
          <span className={styles.subtitle}>{item}</span>
        </div>
      ))}
    </React.Fragment>
  );
};

export default Collection;
