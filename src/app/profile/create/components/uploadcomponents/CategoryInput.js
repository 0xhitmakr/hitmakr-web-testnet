"use client";

import React from "react";
import styles from "../../styles/Create.module.css";
import HitmakrCreativesStore from "@/app/config/store/HitmakrCreativesStore";
import { useRecoilState } from "recoil";

const CategoryInput = () => {
  const [uploadState, setUploadState] = useRecoilState(
    HitmakrCreativesStore.CreativesUpload
  );
  const selectedCategory = uploadState?.selectedCategory || "music";

  const handleCategoryChange = (newCategory) => {
    setUploadState({
      ...uploadState,
      selectedCategory: newCategory,
    });
  };

  return (
    <div className={styles.createUploadContainerInput}>
      <div className={styles.createUploadContainerInputCategory}>
        <div className={styles.createUploadContainerInputCategory}>
          <input
            type="radio"
            id="music"
            name="category"
            value="music"
            checked={selectedCategory === "music"}
            onChange={() => handleCategoryChange("music")}
          />
          <label htmlFor="music">Music</label>

          <input
            type="radio"
            id="sound"
            name="category"
            value="sound"
            checked={selectedCategory === "sound"}
            onChange={() => handleCategoryChange("sound")}
          />
          <label htmlFor="sound">Sound</label>
          <input
            type="radio"
            id="loop"
            name="category"
            value="loop"
            checked={selectedCategory === "loop"}
            onChange={() => handleCategoryChange("loop")}
          />
          <label htmlFor="loop">Loop</label>
        </div>
      </div>
    </div>
  );
};

export default CategoryInput;