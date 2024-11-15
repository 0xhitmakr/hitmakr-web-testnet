"use client"

import React, { useState } from "react";
import { useRecoilState } from "recoil";
import HitmakrCreativesStore from "@/app/config/store/HitmakrCreativesStore";
import styles from "../../styles/Create.module.css";
import '@flaticon/flaticon-uicons/css/all/all.css';

export default function MintPrice(){

    const [uploadState, setUploadState] = useRecoilState(
        HitmakrCreativesStore.CreativesUpload
    );

    const [mintPrice, setMintPrice] = useState(uploadState.mintPrice || 0); 

    const handleMintPriceChange = (e) => {
        const newValue = Math.max(0, parseInt(e.target.value, 10) || 0); 
        setMintPrice(newValue); 
        setUploadState((prevUploadState) => ({
            ...prevUploadState,
            mintPrice: newValue, 
        }));
    }

    const incrementMintPrice = () => {
        const newValue = mintPrice + 1;
        setMintPrice(newValue);
        setUploadState((prevUploadState) => ({
            ...prevUploadState,
            mintPrice: newValue,
        }));
    }

    const decrementMintPrice = () => {
        const newValue = Math.max(0, mintPrice - 1);
        setMintPrice(newValue);
        setUploadState((prevUploadState) => ({
            ...prevUploadState,
            mintPrice: newValue,
        }));
    }

    return(
        <div className={styles.createUploadContainerInput}>
            <div className={styles.createUploadContainerInputCover}>
            <div className={styles.createUploadContainerInputTitle}>
                <p>Purchase Price in USDC</p>
            </div>
            <div className={styles.mintPrice}>
                <span
                className={styles.mintPriceButtons}
                onClick={decrementMintPrice}
                >
                    <i className="fi fi-br-minus"></i>
                </span>
                <input
                    type="number"
                    className={styles.mintPriceInput}
                    value={mintPrice}
                    onChange={handleMintPriceChange}
                    min="2"
                />
                <span
                className={styles.mintPriceButtons}
                onClick={incrementMintPrice}
                >
                    <i className="fi fi-br-plus"></i>
                </span>
            </div>
            </div>
            
        </div>
    )
}