"use client";

import React from "react";
import styles from "../../styles/Create.module.css";
import { musicGenres } from "@/lib/metadata/GenreData";
import { licenseOptions } from "@/lib/metadata/LicenseData";
import { countryData } from "@/lib/metadata/CountryData";
import HitmakrCreativesStore from "@/app/config/store/HitmakrCreativesStore";
import { languagesData } from "@/lib/metadata/LanguageData";
import { useRecoilState } from "recoil";

const DetailsInput = () => {
  const [uploadState, setUploadState] = useRecoilState(
    HitmakrCreativesStore.CreativesUpload
  );
  const { songDetails } = uploadState;

  const handleDetailsChange = (e) => {
    const { name, value } = e.target;

    if (name === "language") {
      const selectedLanguageName = languagesData[value] || "";
      setUploadState((prevUploadState) => ({
        ...prevUploadState,
        songDetails: {
          ...prevUploadState.songDetails,
          [name]: selectedLanguageName, 
        },
      }));
      return; 
    }

    setUploadState((prevUploadState) => ({
      ...prevUploadState,
      songDetails: {
        ...prevUploadState.songDetails,
        [name]: value,
      },
    }));
  };

  const getLanguageCode = (languageName) => {
    for (const [code, name] of Object.entries(languagesData)) {
      if (name === languageName) {
        return code;
      }
    }
    return ""; 
  };

  return (
    <div className={styles.createUploadContainerInput}>
      <div className={styles.createUploadContainerInputCover}>
        <div className={styles.createUploadContainerInputTitle}>
          <p> Details* </p>
        </div>
        <div className={styles.formDetails}>
          <label htmlFor="title" className={styles.formDetailsLabel}>
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            placeholder="Enter title"
            onChange={handleDetailsChange}
            required
            className={styles.formDetailsInput}
            value={songDetails.title}
          />
        </div>
        <div className={styles.formDetails}>
          <label htmlFor="description" className={styles.formDetailsLabel}>
            Description
          </label>
          <textarea
            id="description"
            name="description"
            placeholder="Enter description"
            onChange={handleDetailsChange}
            className={styles.formDetailsInput}
            value={songDetails.description}
          />
        </div>
        <div className={styles.formDetails}>
          <label htmlFor="genre" className={styles.formDetailsLabel}>
            Genre
          </label>
          <select
            id="genre"
            name="genre"
            onChange={handleDetailsChange}
            required
            className={styles.formDetailsInput}
            value={songDetails.genre}
          >
            <option value="">Select Genre</option>
            {musicGenres.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.formDetails}>
          <label htmlFor="country" className={styles.formDetailsLabel}>
            Country
          </label>
          <select
            id="country"
            name="country"
            onChange={handleDetailsChange}
            required
            className={styles.formDetailsInput}
            value={songDetails.country}
          >
            <option value="">Select Country</option>
            {Object.entries(countryData).map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.formDetails}>
        <label htmlFor="language" className={styles.formDetailsLabel}>
          Language
        </label>
        <select
          id="language"
          name="language"
          onChange={handleDetailsChange}
          required
          className={styles.formDetailsInput}
          value={getLanguageCode(songDetails.language)} // Get code from name
        >
          <option value="">Select Language</option>
          {Object.entries(languagesData).map(([code, name]) => (
            <option key={code} value={code}> 
              {name} 
            </option>
          ))}
        </select>
      </div>
        <div className={styles.formDetails}>
          <label htmlFor="license" className={styles.formDetailsLabel}>
            License
          </label>
          <select
            id="license"
            name="license"
            onChange={handleDetailsChange}
            required
            className={styles.formDetailsInput}
            value={songDetails.license}
          >
            <option value="">Select License</option>
            {licenseOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default DetailsInput;