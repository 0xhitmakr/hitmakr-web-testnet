"use client";

import React, { useState } from "react";
import styles from "../../styles/Create.module.css";
import HitmakrCreativesStore from "@/app/config/store/HitmakrCreativesStore";
import { useRecoilState } from "recoil";
import { ChevronDown } from 'lucide-react';

const chains = {
  "Skale Calypso": "SKL",
};

const ChainSelect = () => {
  const [uploadState, setUploadState] = useRecoilState(
    HitmakrCreativesStore.CreativesUpload
  );
  const [isOpen, setIsOpen] = useState(false);
  const selectedChain = uploadState?.selectedChain || "SKL";

  const handleChainChange = (chainCode) => {
    setUploadState({
      ...uploadState,
      selectedChain: chainCode,
    });
    setIsOpen(false);
  };

  return (
    <div className={styles.chainSelectContainer}>
      <div 
        className={styles.chainSelectButton} 
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{Object.keys(chains).find(key => chains[key] === selectedChain)}</span>
        <ChevronDown 
          size={16} 
          className={`${styles.chainSelectIcon} ${isOpen ? styles.rotate : ''}`}
        />
      </div>
      
      {isOpen && (
        <div className={styles.chainSelectDropdown}>
          {Object.entries(chains).map(([chainName, chainCode]) => (
            <div
              key={chainCode}
              className={`${styles.chainSelectOption} ${
                selectedChain === chainCode ? styles.selected : ''
              }`}
              onClick={() => handleChainChange(chainCode)}
            >
              {chainName}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChainSelect;