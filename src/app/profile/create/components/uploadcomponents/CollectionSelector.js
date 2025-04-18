"use client";

import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useRecoilState } from "recoil";
import HitmakrCreativesStore from "@/app/config/store/HitmakrCreativesStore";
import styles from "../../styles/Create.module.css";

const CollectionSelector = () => {
  const { address, chainId } = useAccount();
  const [uploadState, setUploadState] = useRecoilState(
    HitmakrCreativesStore.CreativesUpload
  );

  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCollections = async () => {
    if (!address) return;

    setLoading(true);
    const authToken = localStorage.getItem("@appkit/siwx-auth-token");
    const nonceToken = localStorage.getItem("@appkit/siwx-nonce-token");

    try {
      if (!authToken || !nonceToken) {
        throw new Error(
          "Authentication required. Please reconnect your wallet."
        );
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_HITMAKR_SERVER}/collection/user-collections`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "x-nonce-token": nonceToken,
            "x-user-address": address,
            "x-chain-id": chainId.toString(),
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch collections");
      }

      const data = await response.json();
      setCollections(data.collections);
      setError(null);
    } catch (error) {
      console.error("Error fetching collections:", error);
      setError(error.message || "Failed to load collections");
    } finally {
      setLoading(false);
    }
  };

  const handleCollectionChange = (e) => {
    const selectedCollectionId = e.target.value;
    setUploadState((prevState) => ({
      ...prevState,
      selectedCollectionId,
    }));
  };

  useEffect(() => {
    fetchCollections();
  }, [address]);

  return (
    <div className={styles.formDetails}>
      <label htmlFor="collection" className={styles.formDetailsLabel}>
        Add to Collection (Optional)
      </label>
      <select
        id="collection"
        name="collection"
        onChange={handleCollectionChange}
        className={styles.formDetailsInput}
        value={uploadState.selectedCollectionId || ""}
      >
        <option value="">Select Collection</option>
        {collections.map((collection) => (
          <option key={collection.collectionId} value={collection.collectionId}>
            {collection.name} ({collection.totalTracks}{" "}
            {collection.totalTracks === 1 ? "DSRC" : "DSRCs"})
          </option>
        ))}
      </select>
      {loading && (
        <p className={styles.formDetailsHelp}>Loading collections...</p>
      )}
      {error && (
        <p className={styles.formDetailsHelp} style={{ color: "red" }}>
          {error}
        </p>
      )}
    </div>
  );
};

export default CollectionSelector;
