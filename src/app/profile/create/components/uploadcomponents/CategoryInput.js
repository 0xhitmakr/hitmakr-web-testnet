"use client";

import React, { useState } from "react";
import styles from "../../styles/Create.module.css";
import HitmakrCreativesStore from "@/app/config/store/HitmakrCreativesStore";
import { useRecoilState } from "recoil";
import { ChevronLeft, ChevronRight } from "lucide-react";

const CategoryInput = () => {
  const [uploadState, setUploadState] = useRecoilState(
    HitmakrCreativesStore.CreativesUpload
  );
  const categories = [
    { id: "music", label: "Music" },
    { id: "sound", label: "Sound" },
    { id: "loop", label: "Loop" },
    { id: "instrumentals", label: "Instrumentals" },
    { id: "sfx", label: "SFX" }
  ];
  
  const [currentIndex, setCurrentIndex] = useState(
    categories.findIndex(cat => cat.id === (uploadState?.selectedCategory || "music"))
  );

  const handleNavigation = (direction) => {
    let newIndex;
    if (direction === 'left') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : categories.length - 1;
    } else {
      newIndex = currentIndex < categories.length - 1 ? currentIndex + 1 : 0;
    }
    setCurrentIndex(newIndex);
    setUploadState({
      ...uploadState,
      selectedCategory: categories[newIndex].id,
    });
  };

  return (
    <div className={styles.createUploadContainerInput}>
      <div className={styles.categoryNavigationContainer}>
        <button 
          className={styles.navigationButton}
          onClick={() => handleNavigation('left')}
        >
          <ChevronLeft size={20} />
        </button>

        <div className={styles.categorySlider}>
          <div className={styles.categoryOption}>
            <input
              type="radio"
              id={categories[currentIndex].id}
              name="category"
              value={categories[currentIndex].id}
              checked={true}
              readOnly
            />
            <label htmlFor={categories[currentIndex].id}>
              {categories[currentIndex].label}
            </label>
          </div>
        </div>

        <button 
          className={styles.navigationButton}
          onClick={() => handleNavigation('right')}
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default CategoryInput;