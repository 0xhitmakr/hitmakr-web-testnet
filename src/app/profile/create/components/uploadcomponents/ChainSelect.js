"use client";
import React from "react";
import styles from "../../styles/Create.module.css";
import HitmakrCreativesStore from "@/app/config/store/HitmakrCreativesStore";
import { useRecoilState } from "recoil";


const chains = {
  "Skale Calypso": "SKL",
};

const ChainSelect = () => {
  const [uploadState, setUploadState] = useRecoilState(
    HitmakrCreativesStore.CreativesUpload
  );
  const selectedChain = uploadState?.selectedChain || "SKL";

  const handleChainChange = (e) => {
    setUploadState({
      ...uploadState,
      selectedChain: e.target.value,
    });
  };

  return (
    <select
      value={selectedChain}
      onChange={handleChainChange}
      className={styles.select}
    >
      {Object.entries(chains).map(([chainName, chainCode]) => (
        <option key={chainCode} value={chainCode}>
          {chainName}
        </option>
      ))}
    </select>
  );
};

export default ChainSelect;